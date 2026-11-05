# Agente Logidma

Bandeja de WhatsApp Business para **Logidma**, corriendo en **Cloudflare Workers** en https://wa.logidma.com.

- **Login** con correo y contraseña (solo el correo autorizado en `ADMIN_EMAIL`), sesiones de 30 días y bloqueo tras intentos fallidos.
- **Chats**: bandeja con no leídos, búsqueda, archivados, nombres personalizados, estados de envío (enviado, entregado, leído) e indicador de la ventana de 24 horas.
- **Envío** de textos y de plantillas aprobadas, también para iniciar chats nuevos.
- **Multimedia**: recibe y envía imágenes, video, audio (incluye notas de voz grabadas desde el navegador) y documentos. Los archivos se guardan en R2 y solo se sirven con sesión.
- **Tiempo real**: los mensajes y estados llegan al instante por WebSocket (Durable Object `RealtimeHub`); si la conexión se cae, la bandeja vuelve al polling.
- **Notas y etiquetas** por contacto, con filtro por etiqueta y búsqueda en las notas.
- **Reenvío por correo**: cada mensaje que llega se reenvía a `ADMIN_EMAIL` por la API de Brevo, con el enlace al chat y el archivo adjunto cuando se puede.
- **Webhook** en `/webhook` que valida la firma de Meta y guarda mensajes y estados en D1.
- Páginas públicas: `/privacidad`, `/terminos`, `/eliminacion-datos`.

## Arquitectura

| Pieza | Dónde |
|---|---|
| Frontend (React + Vite) | `web/` → compilado a `dist/` y servido como assets |
| API y webhook (Hono) | `src/worker/` |
| Base de datos (D1) | `migrations/` |
| Archivos (R2) | bucket `agente-logidma-media`, binding `MEDIA` |
| Tiempo real (Durable Object) | `RealtimeHub` en `src/worker/realtime.ts`, binding `HUB` |

## Datos de Meta

| Dato | Valor |
|---|---|
| App de desarrollador | Agente Logidma (`4790523007843058`) |
| Negocio | Logidma (`1966123967356413`) |
| Número | +52 1 443 848 0153 — Phone Number ID `1253350567872957` |
| Webhook | `https://wa.logidma.com/webhook` |

## Configuración

Variables públicas (`wrangler.jsonc`): `PHONE_NUMBER_ID`, `GRAPH_API_VERSION`.

Secretos (se cargan en Cloudflare, **nunca** en el repositorio):

| Secreto | Descripción |
|---|---|
| `ACCESS_TOKEN` | Token permanente del usuario del sistema con `business_management`, `whatsapp_business_messaging` y `whatsapp_business_management` |
| `APP_SECRET` | Clave secreta de la app (valida la firma de los webhooks) |
| `VERIFY_TOKEN` | Frase de verificación del webhook configurada en Meta |
| `ADMIN_EMAIL` | Único correo que puede iniciar sesión |
| `DASHBOARD_PASSWORD` | Contraseña inicial: solo se usa para crear el usuario en el primer inicio de sesión. Después se cambia desde Configuración → Cuenta y seguridad |
| `BREVO_API_KEY` | Opcional: llave de la API de Brevo (`xkeysib-…`). Sin ella, no se reenvía nada por correo |

## Despliegue

Una sola vez, antes del primer despliegue con multimedia:

```bash
npx wrangler r2 bucket create agente-logidma-media
```

```bash
npm install
npm run deploy   # compila el frontend, aplica migraciones de D1 y despliega
```

Con Cloudflare Workers Builds (despliegue automático desde `main`):

- Build command: `npm run build`
- Deploy command: `npx wrangler d1 migrations apply agente-logidma --remote && npx wrangler deploy`

## Desarrollo local

```bash
cp .dev.vars.example .dev.vars                          # y llena los valores
npx wrangler d1 migrations apply agente-logidma --local
npm run dev:worker                                      # API en http://localhost:8787
npm run dev                                             # frontend con recarga en http://localhost:5173
npm run typecheck
```

## Licencia

Apache 2.0, ver [LICENSE](LICENSE).
