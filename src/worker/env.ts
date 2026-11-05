import type { RealtimeHub } from "./realtime";

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  // Multimedia recibida y enviada (bucket agente-logidma-media).
  MEDIA: R2Bucket;
  // Durable Object con los WebSocket del panel.
  HUB: DurableObjectNamespace<RealtimeHub>;
  // Workers AI (proveedor de IA sin llave).
  AI: Ai;

  // Variables (wrangler.jsonc)
  PHONE_NUMBER_ID: string;
  // Cuenta de WhatsApp (plantillas) y app de Meta (subida de ejemplos de encabezado).
  WABA_ID: string;
  APP_ID: string;
  GRAPH_API_VERSION: string;

  // Secretos (wrangler secret put)
  ACCESS_TOKEN: string;
  APP_SECRET: string;
  VERIFY_TOKEN: string;
  ADMIN_EMAIL: string;
  // Contraseña inicial: solo se usa para crear el usuario la primera vez.
  DASHBOARD_PASSWORD: string;
  // Opcional: llave de la Claude API (proveedor "claude" en Configuración → IA).
  ANTHROPIC_API_KEY?: string;
  // Opcional: llave de la API de Brevo. Con ella, cada mensaje entrante se reenvía a ADMIN_EMAIL.
  BREVO_API_KEY?: string;
}

export type Session = { userId: number; email: string; sessionId: string };

export type AppEnv = { Bindings: Env; Variables: { session: Session } };
