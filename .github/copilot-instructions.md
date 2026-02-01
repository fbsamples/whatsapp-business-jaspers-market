# Jasper's Market WhatsApp Bot - AI Coding Instructions

## Architecture Overview

This is a WhatsApp Business Platform bot built with Express.js that demonstrates key WhatsApp messaging features. The system follows a webhook-based event handler pattern:

- **Webhook flow**: `/webhook` POST endpoint receives WhatsApp events (messages & status updates)
- **Message routing**: Incoming messages are parsed as `Message` objects and handled by `Conversation.handleMessage()`
- **State management**: Redis cache stores message tracking (e.g., pending delivery confirmations with 15-second TTL)
- **API integration**: Meta's Graph API (via `facebook-nodejs-business-sdk`) sends templated and interactive messages

## Key Services & Responsibilities

**[services/conversation.js](services/conversation.js)**: Routes user interactions to specific message flows

- `handleMessage()`: Routes incoming messages to handlers (e.g., `sendTryOutDemoMessage`, `sendInteractiveMediaMessage`)
- Pattern: Each user interaction triggers a specific demo (interactive replies, media carousel, limited-time offers)

**[services/graph-api.js](services/graph-api.js)**: Wraps Meta's Graph API

- `#makeApiCall()`: Private method that handles reading/typing indicators + actual message send
- Template methods: `messageWithInteractiveReply()`, `messageWithLimitedTimeOfferTemplate()`, `messageWithMediaCardCarousel()`
- Returns API response or throws errors

**[services/message.js](services/message.js)**: Parses raw webhook message data

- Extracts type (interactive button replies), sender phone, message ID
- Interactive message type is extracted from `rawMessage.interactive.button_reply.id`

**[services/status.js](services/status.js)**: Parses message delivery/read status updates

- Used by `Conversation.handleStatus()` to track message lifecycle

**[services/redis.js](services/redis.js)**: Temporary message tracking

- `insert(key)`: Stores message ID with 15-second TTL (for delivery/read confirmations)
- `remove(key)`: Cleans up after status received

**[services/config.js](services/config.js)**: Environment configuration

- Required vars: `ACCESS_TOKEN`, `APP_SECRET`, `VERIFY_TOKEN`, `REDIS_HOST`, `REDIS_PORT`
- Validates env vars at startup via `checkEnvVariables()`

## Common Development Patterns

**Message sending**: Use appropriate `GraphApi.messageWith*` method:

```javascript
// Interactive buttons
GraphApi.messageWithInteractiveReply(
  messageId,
  phoneNumberId,
  recipientPhone,
  text,
  ctaArray,
);

// Templates
GraphApi.messageWithUtilityTemplate(messageId, phoneNumberId, recipientPhone, {
  templateName,
  locale,
  imageLink,
});
```

**Adding new conversation flows**: Add handler function in `conversation.js` following naming pattern `send*Message()`, then route it in `handleMessage()` based on `message.type` value.

**Redis TTL logic**: Messages with uncertain delivery are stored in Redis; webhooks remove them on status update. This prevents redundant status processing.

## External Dependencies & Integration Points

- **Meta Graph API**: All outbound messages require `ACCESS_TOKEN` and `senderPhoneNumberId` (obtained from WhatsApp Business Account)
- **Redis**: Required for state tracking; connection configured via `REDIS_HOST` and `REDIS_PORT`
- **Webhook verification**: Uses `verifyToken` and `APP_SECRET` for signature verification (see `verifyRequestSignature()` in [app.js](app.js))
- **Message templates**: Templates must be created in WhatsApp Manager first; code references them by `templateName`

## Running & Testing

```bash
# Start development server (port 8080)
npm start

# Prerequisites
redis-server --daemonize yes  # Start Redis
ngrok http 8080               # Tunnel for webhook
./template.sh                 # Create message templates (one-time)
```

Set `.env`: `ACCESS_TOKEN`, `APP_SECRET`, `VERIFY_TOKEN`, `REDIS_HOST=localhost`, `REDIS_PORT=6379`
