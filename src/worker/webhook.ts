import type { Context } from "hono";
import { autoReply, shouldTrigger } from "./ai";
import { hmacSha256Hex, safeEqual } from "./crypto";
import { forwardInbound } from "./email";
import type { AppEnv } from "./env";
import { storeInbound } from "./media";
import { notify } from "./realtime";
import { saveMessage, updateStatus } from "./store";
import { applyTemplateChange, TEMPLATE_FIELDS } from "./templates";

const MEDIA_TYPES = ["image", "video", "audio", "document", "sticker"];

// Texto legible de cualquier tipo de mensaje entrante.
export function describeMessage(msg: any): string {
  switch (msg.type) {
    case "text":
      return msg.text?.body ?? "";
    case "image":
      return msg.image?.caption ? `📷 ${msg.image.caption}` : "📷 Imagen";
    case "video":
      return msg.video?.caption ? `🎥 ${msg.video.caption}` : "🎥 Video";
    case "audio":
      return msg.audio?.voice ? "🎤 Nota de voz" : "🎵 Audio";
    case "document":
      return `📄 ${msg.document?.filename ?? "Documento"}`;
    case "sticker":
      return "Sticker";
    case "location":
      return `📍 ${msg.location?.name ?? "Ubicación"} (${msg.location?.latitude}, ${msg.location?.longitude})`;
    case "contacts":
      return `👤 ${msg.contacts?.[0]?.name?.formatted_name ?? "Contacto"}`;
    case "button":
      return msg.button?.text ?? "[botón]";
    case "interactive":
      return (
        msg.interactive?.button_reply?.title ??
        msg.interactive?.list_reply?.title ??
        "[respuesta interactiva]"
      );
    case "reaction":
      return `Reaccionó ${msg.reaction?.emoji ?? ""}`.trim();
    default:
      return `[${msg.type}]`;
  }
}

export function verifyWebhook(c: Context<AppEnv>) {
  const q = c.req.query();
  if (
    !c.env.VERIFY_TOKEN ||
    q["hub.mode"] !== "subscribe" ||
    q["hub.verify_token"] !== c.env.VERIFY_TOKEN
  ) {
    return c.text("Forbidden", 403);
  }
  return c.text(q["hub.challenge"] ?? "");
}

export async function receiveWebhook(c: Context<AppEnv>) {
  const raw = await c.req.text();

  if (!c.env.APP_SECRET) {
    console.error("APP_SECRET no configurado: se rechaza el webhook");
    return c.text("Server not configured", 500);
  }
  const signature = c.req.header("X-Hub-Signature-256") ?? "";
  const expected = "sha256=" + (await hmacSha256Hex(c.env.APP_SECRET, raw));
  if (!safeEqual(signature, expected)) return c.text("Invalid signature", 401);

  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    return c.text("Bad Request", 400);
  }
  if (body.object !== "whatsapp_business_account") return c.text("OK");

  const env = c.env;
  const db = env.DB;
  const changed = new Set<number>();
  // Conversaciones con mensajes nuevos del cliente (para las notificaciones del navegador).
  const inbound = new Set<number>();
  const background: Promise<unknown>[] = [];
  // Último mensaje entrante de cada chat que la IA podría contestar.
  const toAnswer = new Map<number, number>();
  let templatesChanged = false;
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value ?? {};
      // Aprobación, categoría o calidad de una plantilla de esta cuenta.
      if (TEMPLATE_FIELDS.includes(change.field)) {
        if (String(entry.id) !== env.WABA_ID) continue;
        try {
          await applyTemplateChange(env, change.field, value);
          templatesChanged = true;
        } catch (e) {
          console.error("Error al actualizar la plantilla", e);
        }
        continue;
      }
      // Solo mensajes del número configurado en este Worker.
      if (value.metadata?.phone_number_id && value.metadata.phone_number_id !== c.env.PHONE_NUMBER_ID) {
        continue;
      }
      const names = new Map<string, string>(
        (value.contacts ?? []).map((ct: any) => [ct.wa_id, ct.profile?.name])
      );
      for (const msg of value.messages ?? []) {
        const media = MEDIA_TYPES.includes(msg.type) ? msg[msg.type] : null;
        const body = describeMessage(msg);
        const createdAt = parseInt(msg.timestamp, 10) * 1000 || Date.now();
        const saved = await saveMessage(db, {
          waId: msg.from,
          profileName: names.get(msg.from) ?? null,
          wamid: msg.id ?? null,
          direction: "in",
          type: msg.type,
          body,
          payload: msg,
          status: "received",
          createdAt,
          caption: media?.caption ?? null,
          media: media?.id
            ? { id: String(media.id), mime: media.mime_type ?? "application/octet-stream", name: media.filename ?? null }
            : null
        });
        if (!saved) continue;
        changed.add(saved.conversationId);
        inbound.add(saved.conversationId);
        if (shouldTrigger(msg.type)) toAnswer.set(saved.conversationId, saved.messageId);
        else toAnswer.delete(saved.conversationId);
        const forward = (mediaKey: string | null) =>
          forwardInbound(env, {
            conversationId: saved.conversationId,
            messageId: saved.messageId,
            waId: msg.from,
            body,
            createdAt,
            media: media?.id ? { key: mediaKey, name: media.filename ?? null } : null
          }).catch(e => console.error("Error al reenviar por correo", e));
        // La descarga va en segundo plano para responder rápido a Meta; al terminar se avisa al
        // panel y sale el correo, con el archivo adjunto. Una reacción no se reenvía: no es un mensaje.
        if (media?.id) {
          background.push(
            storeInbound(env, saved.messageId, String(media.id))
              .catch(e => {
                console.error("Error al guardar multimedia", e);
                return null;
              })
              .then(key =>
                Promise.all([notify(env, { type: "message", conversationId: saved.conversationId }), forward(key)])
              )
          );
        } else if (msg.type !== "reaction") {
          background.push(forward(null));
        }
      }
      for (const st of value.statuses ?? []) {
        const error = st.errors?.[0]
          ? `${st.errors[0].title ?? ""} ${st.errors[0].error_data?.details ?? ""}`.trim()
          : null;
        const conversationId = await updateStatus(db, st.id, st.status, error);
        if (conversationId) changed.add(conversationId);
      }
    }
  }
  c.executionCtx.waitUntil(
    Promise.all([
      ...[...changed].map(id => notify(env, { type: "message", conversationId: id, inbound: inbound.has(id) })),
      ...(templatesChanged ? [notify(env, { type: "templates" })] : []),
      ...background,
      ...[...toAnswer].map(([conversationId, messageId]) =>
        autoReply(env, conversationId, messageId).catch(e => console.error("Error en la respuesta automática", e))
      )
    ])
  );
  return c.text("OK");
}
