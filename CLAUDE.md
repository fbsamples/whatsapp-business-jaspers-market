# CLAUDE.md — Agente Logidma

Guía para continuar el proyecto sin el historial de conversaciones previas. Escribe en **español** al usuario (David Martínez, dueño de Logidma). Nunca guardes secretos en el repositorio.

## Qué es

Bandeja de WhatsApp Business de **Logidma**, para una sola persona, en **Cloudflare Workers**: https://wa.logidma.com

- `src/worker/` — API y webhook (Hono + TypeScript). Punto de entrada: `index.ts`.
  - `auth.ts`: login, sesiones y cambio de contraseña. `crypto.ts`: PBKDF2, HMAC, tokens.
  - `webhook.ts`: verifica la firma `X-Hub-Signature-256` con `APP_SECRET` y guarda mensajes y estados.
  - `store.ts`: acceso a D1 (contactos, conversaciones, mensajes).
  - `graph.ts`: llamadas a la Graph API (enviar, subir y descargar multimedia).
  - `media.ts`: archivos en R2 (`/api/media/:id` con sesión y `Range`; `/api/media/send`).
  - `realtime.ts`: Durable Object `RealtimeHub` (WebSocket con hibernación en `/api/ws`). Solo manda ids; el navegador vuelve a pedir los datos.
  - `contacts.ts`: notas y etiquetas.
  - `templates.ts`: plantillas (listar/crear/editar/borrar en Meta, copia en D1, cambios por webhook, tarifas).
  - `metrics.ts`: métricas (`/api/metrics`): volumen por día, tiempo de respuesta (tú vs IA), chats esperando y gasto estimado por mes (plantillas, respuestas de servicio desde el 1 oct 2026 y Claude API).
  - `quickReplies.ts`: respuestas rápidas (`/api/quick-replies`), se insertan con `/atajo` en el chat.
  - `ai.ts`: asistente de IA (config en `settings.ai_config`, respuesta automática desde el webhook, sugerencia, resumen, traspaso a humano, uso en `ai_runs`). Proveedores: Workers AI (binding `AI`) o Claude API (`@anthropic-ai/sdk`, secreto opcional `ANTHROPIC_API_KEY`).
  - `email.ts`: reenvía por correo cada mensaje entrante (API de Brevo, secreto opcional `BREVO_API_KEY`, a `ADMIN_EMAIL`). Es una cortesía: si falla, solo queda en los registros.
- `web/` — frontend React + Vite (se compila a `dist/`). Páginas en `web/src/pages/`.
- `web/public/` — páginas legales públicas: `/privacidad`, `/terminos`, `/eliminacion-datos`. Meta las exige, ya están registradas en la app y no hay que moverlas.
- `migrations/` — esquema de D1. Nunca edites una migración aplicada: crea `0002_...sql`.

## Infraestructura (IDs, no secretos)

| Recurso | Valor |
|---|---|
| Cuenta de Cloudflare | `1ef6a06b0e674b43f95c90a63863bc69` |
| Worker | `agente-logidma` (solo `wa.logidma.com`; workers.dev y preview URLs apagados) |
| D1 | `agente-logidma` (`8e3a8d25-afc0-4a0c-b60d-625c8ac5022f`), binding `DB` |
| R2 | `agente-logidma-media`, binding `MEDIA` (privado; créalo con `wrangler r2 bucket create` si no existe) |
| Durable Object | `RealtimeHub`, binding `HUB` (migración `v3`) |
| Workers AI | binding `AI` (`remote: true`: en `wrangler dev` también llama a Cloudflare y consume neuronas) |
| Zona DNS | `logidma.com` en la misma cuenta (tiene otros subdominios de otros proyectos: no tocarlos) |
| Negocio Meta | Logidma `1966123967356413` |
| App Meta | Agente Logidma `4790523007843058` (publicada, en modo live) |
| Cuenta de WhatsApp | `4659287351061167` (suscrita a la app) |
| `WABA_ID` / `APP_ID` | Vars en `wrangler.jsonc` (plantillas y subida del ejemplo de encabezado) |
| Número | +52 1 443 848 0153 — Phone Number ID `1253350567872957` |
| Webhook | `https://wa.logidma.com/webhook` (11 campos suscritos, incluye `messages` y `message_statuses`) |
| Usuario del sistema | "David Martinez", rol Employee, con control total de la app y de la cuenta de WhatsApp |

Secretos del Worker (ya cargados en Cloudflare): `ACCESS_TOKEN`, `APP_SECRET`, `VERIFY_TOKEN`, `ADMIN_EMAIL`, `DASHBOARD_PASSWORD`. Opcional (Fase 4): `ANTHROPIC_API_KEY`, solo si se elige Claude como proveedor (cargada el 2026-10-21, con una llave ligada a un workspace). Opcional: `BREVO_API_KEY`, para el reenvío por correo (cargada el 2026-11-05; sin ella no se reenvía nada). `DASHBOARD_PASSWORD` solo sirvió para crear el usuario; la contraseña real vive hasheada en D1 y se cambia desde Configuración.

El conector MCP **WhatsApp Business** (Meta) sirve para consultar el estado (`whatsapp_biz_onboarding_status`), las plantillas y los números. Sus acciones de escritura piden confirmación explícita del usuario.

## Comandos

```bash
npm install
npm run typecheck                 # worker + web
npm run build                     # frontend → dist/
npm run deploy                    # build + migraciones D1 remotas + wrangler deploy
npx wrangler d1 migrations apply agente-logidma --local   # D1 local para `npm run dev:worker`
```

Para desplegar desde una sesión hacen falta `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` en el entorno. Pídelos al usuario y sugiere guardarlos como secretos del entorno, no en el chat. Antes de desplegar, prueba en local con `wrangler dev`, usando un `.dev.vars` basado en `.dev.vars.example`.

## Convenciones

- Fechas en D1: milisegundos (epoch). Estados de salida: `accepted → sent → delivered → read` (o `failed`), sin retroceder.
- Todo `/api/*` requiere sesión, salvo `/api/auth/login`. Las peticiones que cambian datos deben traer un `Origin` del propio sitio (CSRF).
- Textos de la interfaz en español de México. Diseño adaptable: el usuario trabaja mucho desde iPad.
- Diseño: colores y sombras como variables en `web/src/styles.css` (tema claro y oscuro según el sistema). Íconos SVG de `components/Icon.tsx`, no emojis. Avatares con iniciales y color por contacto (`components/Avatar.tsx`). En pantallas angostas, la barra inferior se oculta con un chat abierto.
- Un PR por fase o cambio. Commits en español.

## Plan (roadmap)

- [x] **Fase 1** — Login con correo (solo `ADMIN_EMAIL`), D1, bandeja de chats, envío de texto y plantillas, ventana de 24 h, archivar y renombrar, configuración.
- [x] **Fase 2** (desplegada el 2026-09-27) — Multimedia en R2 (recibir y enviar imágenes, video, audio, notas de voz y documentos), tiempo real con Durable Object + WebSocket (el polling queda de respaldo: 60 s conectado, 5 s/4 s sin conexión), notas y etiquetas por contacto.
- [x] **Fase 3** (desplegada el 2026-09-27) — Plantillas: listar, crear, editar y borrar vía Graph API (`/{waba-id}/message_templates`), con estado de aprobación en vivo (webhook `message_template_status_update`), vista previa, variables al enviar y costo estimado por categoría. Webhook: `message_template_status_update`, `template_category_update`, `message_template_quality_update` (confirmar que estén suscritos). Tarifas editables en Plantillas → Tarifas.
- [x] **Fase 4** (desplegada el 2026-09-27) — IA en Configuración → Asistente de IA: proveedor **Workers AI** (Llama 3.3 70B por defecto, sin llave) o **Claude API** (Opus 5 por defecto; Sonnet 5 y Haiku 4.5 a elegir), respuesta automática global o por chat (auto/activa/apagada), nombre del negocio, instrucciones y base de conocimiento, horario (siempre / en horario / fuera de horario), límite de respuestas por chat en 24 h, pausa tras respuesta manual, traspaso a humano (palabras clave, la IA responde `[[HUMANO]]` o se llega al límite), respuesta sugerida (✨ en el chat), resumen del chat, probador sin enviar y uso de 30 días. Solo contesta dentro de la ventana de 24 h, a mensajes de menos de 10 min, con 4 s de espera para juntar mensajes seguidos. El prompt limita al asistente a temas del negocio (política de Meta). Pendiente a futuro: transcribir notas de voz.
- [x] **Fase 5** (desplegada el 2026-09-28; migración `0005`) — Página **Métricas** (7/30/90 días: recibidos/enviados por día, tiempo de respuesta con mediana y "9 de cada 10", chats esperando respuesta, gasto estimado del mes actual y el anterior). **Respuestas rápidas** con `/` en el chat (↑↓, Enter/Tab, Esc; `{nombre}` = primer nombre), administradas en Configuración. **Notificaciones del navegador** por dispositivo (Configuración → Notificaciones) y contador de no leídos en el título; el evento `message` del WebSocket trae `inbound: true` cuando escribe el cliente (`/api/inbox` da el resumen). Limitación: Safari en iPad no muestra notificaciones de una pestaña; para eso haría falta Web Push (VAPID) en una fase futura.
- [x] **Rediseño visual** (desplegado el 2026-09-28; solo frontend) — íconos SVG en lugar de emojis, logo nuevo, avatares con color por contacto, burbujas con colita, encabezado del chat compacto, barra inferior oculta con un chat abierto en pantallas angostas y tema oscuro revisado.
- [x] **Modelos Claude 5.5 y Fable 5.1** (desplegado el 2026-10-22; solo `src/worker/ai.ts`) — menú de Claude con Opus 5.5 (recomendado, y el predeterminado de una configuración nueva por ser el primero de `CLAUDE_MODELS`), Sonnet 5.5, Haiku 5.5, Fable 5.1 y los tres anteriores (Opus 5, Sonnet 5 y Haiku 4.5, marcados «anterior»; se quedan porque la configuración guardada tenía Opus 5). Respaldo de la API (`server-side-fallback-2026-07-01`, `fallbacks: "default"`) en Opus 5.5, Sonnet 5.5, Fable 5.1 y Opus 5 (`FALLBACK_MODELS`); esfuerzo bajo en todos menos Haiku 4.5. Los siete se probaron con la petición real del bot. El 2026-10-21 se subió como versión `499a633a` parchando el bundle publicado desde la PC de casa, y se desplegó el 2026-10-22 con `cf workers deployments create`; este cambio trae el mismo código al repo.
- [x] **Reenvío por correo** (desplegado el 2026-11-05; sin migración ni cambios en el panel) — `email.ts` manda un correo a `ADMIN_EMAIL` por cada mensaje entrante nuevo, desde `Agente Logidma <agente@logidma.com>` (dominio autenticado en Brevo), con el enlace al chat. Se adjunta el archivo si pesa hasta 5 MB y su tipo es de los que el panel abre sin riesgo (`INLINE`); si no, o si Brevo lo rechaza (`.webp`), el correo sale igual con un aviso. No se reenvían reacciones ni mensajes duplicados. Con más de 150 mensajes entrantes en 24 h se deja de reenviar, porque los 300 correos diarios de la cuenta de Brevo los comparten otros proyectos. **Trampas de Brevo:** la llave que da para su MCP viene dentro de un JSON en base64 y la API solo acepta la de adentro (`xkeysib-…`); además bloquea por «IP no reconocida» (401, se autoriza en app.brevo.com/security/authorised_ips): el 2026-11-05 la llave respondió 200 también saliendo de la red de Cloudflare, y si un día deja de pasar, los registros del Worker lo dirán. **Probar en local:** `wrangler dev` con `--persist-to` y `--env-file` fuera del repo, `ACCESS_TOKEN` falso y webhooks firmados con el `APP_SECRET` de ese archivo; los correos sí salen de verdad.

## Costos (contexto para el usuario)

- Cloudflare: plan gratis suficiente. Workers Paid (US$5/mes) solo si se excede.
- Meta cobra por mensaje de plantilla. **Desde el 1 de octubre de 2026 también cobra las respuestas de servicio**, a la tarifa de utilidad, con 1,000 gratis al mes por número según 360dialog. La cuenta ya tiene método de pago.

## Pendientes de seguridad

Algunas credenciales se compartieron en un chat anterior. Hay que rotarlas y cargar los valores nuevos **directo en Cloudflare**:

1. Token de API de Cloudflare: *roll* o borrarlo.
2. Llaves de R2 y secreto de Cloudinary: regenerarlos, aunque este proyecto no los usa todavía.
3. Meta: restablecer el App Secret → actualizar `APP_SECRET` en el Worker. Revocar el token del usuario del sistema y generar uno nuevo → actualizar `ACCESS_TOKEN`.
4. Conectar el repo a Workers Builds:
   - Build: `npm run build`
   - Deploy: `npx wrangler d1 migrations apply agente-logidma --remote && npx wrangler deploy`
