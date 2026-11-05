// Reenvío por correo (API de Brevo) de cada mensaje que llega por WhatsApp.
//
// El correo es una cortesía: el mensaje ya está en D1 y en el panel. Si algo falla aquí se
// registra y nada más; nunca debe afectar la respuesta a Meta ni la de la IA.

import type { Env } from "./env";
import { EXTENSIONS, INLINE } from "./media";

const BREVO_SEND = "https://api.brevo.com/v3/smtp/email";
const SENDER = { name: "Agente Logidma", email: "agente@logidma.com" };
const PANEL_CHAT = "https://wa.logidma.com/#/chats/";
const TIME_ZONE = "America/Mexico_City";

// Cabe cualquier foto de WhatsApp (5 MB). Lo que pese más se abre en el panel.
const MAX_ATTACHMENT = 5 * 1024 * 1024;

// La cuenta de Brevo da 300 correos al día y la comparten otros proyectos (sus accesos y avisos).
// Si alguien satura el número de WhatsApp, se deja de reenviar antes de dejarlos sin correo.
const MAX_PER_DAY = 150;
const DAY_MS = 24 * 60 * 60 * 1000;

export type InboundEmail = {
  conversationId: number;
  messageId: number;
  waId: string;
  body: string;
  createdAt: number;
  // Si el mensaje trae archivo: su llave en R2 (null si no se pudo guardar) y su nombre original.
  media: { key: string | null; name: string | null } | null;
};

type Attachment = { name: string; content: string };

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

// Asunto de una línea: quién escribe y el principio del mensaje, para leerlo desde el aviso del correo.
function subjectOf(who: string, body: string): string {
  const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();
  const chars = [...oneLine(body)];
  const preview = chars.slice(0, 80).join("") + (chars.length > 80 ? "…" : "");
  return preview ? `${oneLine(who)}: ${preview}` : oneLine(who);
}

// Solo se adjunta lo que el panel también abre sin riesgo, y con la extensión de su tipo real:
// el nombre lo elige quien lo manda (un «factura.html» que dice ser PDF no llega como .html).
async function readAttachment(env: Env, m: InboundEmail): Promise<Attachment | null> {
  const key = m.media?.key;
  if (!key) return null;
  const info = await env.MEDIA.head(key);
  const mime = info?.httpMetadata?.contentType ?? "";
  if (!info || info.size > MAX_ATTACHMENT || !INLINE.test(mime)) return null;
  const file = await env.MEDIA.get(key);
  if (!file) return null;

  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  // Por partes: pasar el archivo completo a fromCharCode desborda la pila.
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  const ext = EXTENSIONS[mime] ?? "";
  const original = m.media?.name;
  const name = ext && original?.toLowerCase().endsWith(ext) ? original : `archivo-${m.messageId}${ext}`;
  return { name, content: btoa(binary) };
}

function sendEmail(env: Env, to: string, subject: string, html: string, text: string, attachment: Attachment | null) {
  return fetch(BREVO_SEND, {
    method: "POST",
    headers: { "api-key": env.BREVO_API_KEY!, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sender: SENDER,
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
      tags: ["agente-logidma"],
      ...(attachment ? { attachment: [attachment] } : {})
    })
  });
}

export async function forwardInbound(env: Env, m: InboundEmail): Promise<void> {
  const to = env.ADMIN_EMAIL?.trim();
  if (!env.BREVO_API_KEY || !to) return;

  const [recent, contact] = await Promise.all([
    env.DB.prepare("SELECT count(*) AS n FROM messages WHERE direction = 'in' AND created_at > ?")
      .bind(Date.now() - DAY_MS)
      .first<{ n: number }>(),
    env.DB.prepare("SELECT custom_name, profile_name FROM contacts WHERE wa_id = ?")
      .bind(m.waId)
      .first<{ custom_name: string | null; profile_name: string | null }>()
  ]);
  if ((recent?.n ?? 0) > MAX_PER_DAY) {
    console.warn(`Reenvío por correo en pausa: ${recent?.n} mensajes en 24 h`);
    return;
  }

  const phone = `+${m.waId}`;
  const who = contact?.custom_name || contact?.profile_name || phone;
  const when = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: TIME_ZONE }).format(m.createdAt);
  const from = who === phone ? phone : `${who} · ${phone}`;
  const link = `${PANEL_CHAT}${m.conversationId}`;
  const footer = "Si respondes este correo, el cliente no lo recibe: contéstale desde el panel.";

  const compose = (note: string) => ({
    html: `<!doctype html><html lang="es"><body style="margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#111b21;line-height:1.5">
<div style="max-width:560px">
<p style="margin:0 0 4px;font-size:16px;font-weight:600">${escapeHtml(who)}</p>
<p style="margin:0 0 16px;font-size:13px;color:#667781">${escapeHtml(who === phone ? when : `${phone} · ${when}`)}</p>
<div style="padding:12px 14px;border-radius:10px;background:#f0f2f5;font-size:16px;white-space:pre-wrap;word-break:break-word">${escapeHtml(m.body)}</div>
${note ? `<p style="margin:12px 0 0;font-size:14px;color:#667781">${note}</p>` : ""}
<p style="margin:20px 0 0"><a href="${link}" style="display:inline-block;padding:10px 18px;border-radius:8px;background:#075e54;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none">Abrir el chat</a></p>
<p style="margin:16px 0 0;font-size:12px;color:#667781">${footer}</p>
</div></body></html>`,
    text: [m.body, "", `${from}, ${when}`, ...(note ? [note] : []), "", `Abrir el chat: ${link}`, footer].join("\n")
  });

  const subject = subjectOf(who, m.body);
  const noFile = m.media ? "El archivo no viene adjunto: ábrelo en el panel." : "";
  const attachment = await readAttachment(env, m).catch(e => {
    console.error("No se pudo leer el archivo para el correo", e);
    return null;
  });

  const first = compose(attachment ? "" : noFile);
  let res = await sendEmail(env, to, subject, first.html, first.text, attachment);
  // Brevo rechaza algunos tipos de archivo (.webp, por ejemplo): el mensaje llega de todos modos.
  if (!res.ok && attachment) {
    console.warn(`Brevo no aceptó el adjunto (${res.status}): ${await res.text()}`);
    const plain = compose(noFile);
    res = await sendEmail(env, to, subject, plain.html, plain.text, null);
  }
  if (!res.ok) console.error(`Brevo no aceptó el correo (${res.status}): ${await res.text()}`);
}
