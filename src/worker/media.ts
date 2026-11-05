// Multimedia: los archivos recibidos y enviados se guardan en R2 y se sirven solo con sesión.

import { Hono } from "hono";
import type { AppEnv, Env } from "./env";
import { downloadMedia, graphSend, uploadMedia } from "./graph";
import { pauseAfterHuman } from "./ai";
import { notify } from "./realtime";
import { saveMessage } from "./store";

// Tipos y límites que acepta WhatsApp Cloud API para enviar.
const MB = 1024 * 1024;
const OUTBOUND: { kind: "image" | "video" | "audio"; mimes: string[]; max: number }[] = [
  { kind: "image", mimes: ["image/jpeg", "image/png"], max: 5 * MB },
  { kind: "video", mimes: ["video/mp4", "video/3gpp"], max: 16 * MB },
  { kind: "audio", mimes: ["audio/aac", "audio/amr", "audio/mpeg", "audio/mp4", "audio/ogg"], max: 16 * MB }
];
const DOCUMENT_MAX = 100 * MB;

// Tipos que el navegador puede mostrar dentro del panel sin riesgo. El resto se descarga.
export const INLINE = /^(image\/(jpeg|png|webp|gif)|audio\/.+|video\/.+|application\/pdf)$/;

export const EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "video/mp4": ".mp4",
  "video/3gpp": ".3gp",
  "audio/ogg": ".ogg",
  "audio/mpeg": ".mp3",
  "audio/mp4": ".m4a",
  "audio/aac": ".aac",
  "audio/amr": ".amr",
  "application/pdf": ".pdf"
};

type MediaRow = {
  id: number;
  direction: string;
  media_id: string | null;
  media_key: string | null;
  media_mime: string | null;
  media_name: string | null;
};

function baseMime(mime: string): string {
  return mime.split(";")[0].trim().toLowerCase();
}

// Descarga de Meta un archivo recibido y lo guarda en R2. Devuelve la llave o null si falló.
export async function storeInbound(env: Env, messageId: number, mediaId: string): Promise<string | null> {
  const file = await downloadMedia(env, mediaId);
  if ("error" in file) {
    console.error(`Multimedia ${mediaId}: ${file.error}`);
    return null;
  }
  const key = `in/${mediaId}`;
  const mime = baseMime(file.mime);
  await env.MEDIA.put(key, file.bytes, { httpMetadata: { contentType: mime } });
  await env.DB.prepare("UPDATE messages SET media_key = ?, media_mime = ?, media_size = ? WHERE id = ?")
    .bind(key, mime, file.bytes.byteLength, messageId)
    .run();
  return key;
}

function contentDisposition(kind: "inline" | "attachment", name: string) {
  const ascii = name.replace(/[^\x20-\x7e]|["\\]/g, "_");
  return `${kind}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

type Outbound = { mime: string; name: string; kind: "image" | "video" | "audio" | "document" };

// Tipo de WhatsApp de un archivo por enviar y si cabe en su límite de tamaño.
export function checkOutbound(file: File): Outbound | { error: string } {
  const mime = baseMime(file.type || "application/octet-stream");
  const name = (file.name || "archivo").slice(0, 200);
  const rule = OUTBOUND.find(r => r.mimes.includes(mime));
  const kind = rule?.kind ?? "document";
  const max = rule?.max ?? DOCUMENT_MAX;
  if (file.size > max) {
    const label = { image: "Las imágenes", video: "Los videos", audio: "Los audios", document: "Los documentos" }[kind];
    return { error: `${label} pueden pesar hasta ${max / MB} MB en WhatsApp` };
  }
  return { mime, name, kind };
}

export const mediaRoutes = new Hono<AppEnv>();

// GET /api/media/:messageId[?download=1] — sirve el archivo de un mensaje (con soporte de Range
// para que el audio y el video se reproduzcan en Safari/iPad).
mediaRoutes.get("/:messageId", async c => {
  const row = await c.env.DB.prepare(
    "SELECT id, direction, media_id, media_key, media_mime, media_name FROM messages WHERE id = ?"
  )
    .bind(Number(c.req.param("messageId")))
    .first<MediaRow>();
  if (!row || (!row.media_key && !row.media_id)) return c.json({ error: "Sin archivo" }, 404);

  // Si la descarga del webhook falló, se intenta de nuevo ahora (Meta guarda el archivo ~30 días).
  let key = row.media_key;
  if (!key && row.media_id) key = await storeInbound(c.env, row.id, row.media_id);
  if (!key) return c.json({ error: "No se pudo obtener el archivo de Meta" }, 502);

  const req = c.req.raw;
  const hasRange = req.headers.has("Range");
  const obj = await c.env.MEDIA.get(key, { range: hasRange ? req.headers : undefined, onlyIf: req.headers });
  if (!obj) return c.json({ error: "Archivo no encontrado" }, 404);

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  const mime = baseMime(headers.get("Content-Type") || row.media_mime || "application/octet-stream");
  headers.set("Content-Type", mime);
  headers.set("ETag", obj.httpEtag);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "private, max-age=86400");
  headers.set("X-Content-Type-Options", "nosniff");
  const name = row.media_name || `archivo-${row.id}${EXTENSIONS[mime] ?? ""}`;
  const inline = INLINE.test(mime) && !c.req.query("download");
  headers.set("Content-Disposition", contentDisposition(inline ? "inline" : "attachment", name));
  // Aunque alguien mande un HTML o SVG, nunca corre scripts en el origen del panel.
  if (mime !== "application/pdf") headers.set("Content-Security-Policy", "sandbox; default-src 'none'");

  if (!("body" in obj)) return new Response(null, { status: 304, headers });

  if (hasRange && obj.range) {
    const r = obj.range as { offset?: number; length?: number; suffix?: number };
    const offset = r.suffix !== undefined ? obj.size - r.suffix : r.offset ?? 0;
    const length = r.suffix !== undefined ? r.suffix : r.length ?? obj.size - offset;
    headers.set("Content-Range", `bytes ${offset}-${offset + length - 1}/${obj.size}`);
    headers.set("Content-Length", String(length));
    return new Response(obj.body, { status: 206, headers });
  }
  headers.set("Content-Length", String(obj.size));
  return new Response(obj.body, { headers });
});

// POST /api/media/upload (multipart): file — lo sube a Meta y devuelve su media_id
// (para el encabezado multimedia de una plantilla).
mediaRoutes.post("/upload", async c => {
  const form = await c.req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0) return c.json({ error: "Elige un archivo" }, 400);
  const checked = checkOutbound(file);
  if ("error" in checked) return c.json({ error: checked.error }, 400);
  const uploaded = await uploadMedia(c.env, file, checked.mime, checked.name);
  if ("error" in uploaded) return c.json({ error: uploaded.error }, 502);
  return c.json({ id: uploaded.id, kind: checked.kind, mime: checked.mime, name: checked.name });
});

// POST /api/media/send (multipart): to, file, caption? — sube el archivo a Meta y lo envía.
mediaRoutes.post("/send", async c => {
  const form = await c.req.formData().catch(() => null);
  const file = form?.get("file");
  const to = String(form?.get("to") ?? "").replace(/\D/g, "");
  const caption = String(form?.get("caption") ?? "").trim().slice(0, 1024);
  if (!to) return c.json({ error: "Falta el número destino" }, 400);
  if (!(file instanceof File) || file.size === 0) return c.json({ error: "Elige un archivo" }, 400);

  const checked = checkOutbound(file);
  if ("error" in checked) return c.json({ error: checked.error }, 400);
  const { mime, name, kind } = checked;

  const uploaded = await uploadMedia(c.env, file, mime, name);
  if ("error" in uploaded) return c.json({ error: uploaded.error }, 502);

  const media: Record<string, string> = { id: uploaded.id };
  if (caption && kind !== "audio") media.caption = caption;
  if (kind === "document") media.filename = name;
  const payload = { type: kind, [kind]: media };

  const sent = await graphSend(c.env, { to, ...payload });
  if ("error" in sent) return c.json({ error: sent.error }, 502);

  // Copia propia en R2. Si falla, el archivo sigue disponible en Meta por su media_id.
  let key: string | null = `out/${crypto.randomUUID()}`;
  try {
    await c.env.MEDIA.put(key, file, { httpMetadata: { contentType: mime } });
  } catch (e) {
    console.error("No se pudo guardar en R2", e);
    key = null;
  }

  const icon = { image: "📷", video: "🎥", audio: "🎵", document: "📄" }[kind];
  const label = { image: "Imagen", video: "Video", audio: "Audio", document: name }[kind];
  const saved = await saveMessage(c.env.DB, {
    waId: sent.waId ?? to,
    wamid: sent.wamid,
    direction: "out",
    type: kind,
    body: `${icon} ${kind !== "audio" && kind !== "document" && caption ? caption : label}`,
    caption: kind !== "audio" ? caption || null : null,
    payload,
    status: "accepted",
    createdAt: Date.now(),
    media: { id: uploaded.id, key, mime, size: file.size, name }
  });
  if (saved) {
    c.executionCtx.waitUntil(
      Promise.all([
        pauseAfterHuman(c.env, saved.conversationId),
        notify(c.env, { type: "message", conversationId: saved.conversationId })
      ])
    );
  }
  return c.json({ ok: true, conversationId: saved?.conversationId ?? null });
});
