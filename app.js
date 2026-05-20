"use strict";

require("dotenv").config();

const express = require("express");
const { json, urlencoded } = require("body-parser");
const path = require("path");

const config = require("./services/config");
const graphApi = require("./services/graph-api");

config.checkEnvVariables();

const app = express();
const messages = [];

app.use(urlencoded({ extended: true }));
app.use(json());
app.use(express.static(path.join(__dirname, "public")));

// Webhook verification (Meta handshake)
app.get("/webhook", (req, res) => {
  if (
    req.query["hub.mode"] !== "subscribe" ||
    req.query["hub.verify_token"] !== config.verifyToken
  ) {
    return res.sendStatus(403);
  }
  res.send(req.query["hub.challenge"]);
});

// Receive incoming WhatsApp messages
app.post("/webhook", (req, res) => {
  if (req.body.object === "whatsapp_business_account") {
    req.body.entry?.forEach(entry => {
      entry.changes?.forEach(change => {
        const value = change.value;
        if (value?.messages) {
          value.messages.forEach(msg => {
            messages.unshift({
              direction: "incoming",
              from: msg.from,
              text: msg.text?.body || `[${msg.type}]`,
              timestamp: new Date(parseInt(msg.timestamp) * 1000).toISOString()
            });
            if (messages.length > 200) messages.pop();
          });
        }
      });
    });
  }
  res.sendStatus(200);
});

// API: message history
app.get("/api/messages", (req, res) => {
  res.json(messages);
});

// API: send text message
app.post("/api/send", async (req, res) => {
  const { to, message } = req.body;
  if (!to || !message) {
    return res.status(400).json({ error: "Faltan campos: to, message" });
  }
  try {
    const result = await graphApi.sendTextMessage(to, message);
    messages.unshift({
      direction: "outgoing",
      to,
      text: message,
      timestamp: new Date().toISOString()
    });
    res.json({ success: true, result });
  } catch (err) {
    console.error("Error sending message:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// API: send template
app.post("/api/send-template", async (req, res) => {
  const { to, templateName, languageCode, components } = req.body;
  if (!to || !templateName) {
    return res.status(400).json({ error: "Faltan campos: to, templateName" });
  }
  try {
    const result = await graphApi.sendTemplate(to, templateName, languageCode || "en_US", components);
    messages.unshift({
      direction: "outgoing",
      to,
      text: `[Template: ${templateName}]`,
      timestamp: new Date().toISOString()
    });
    res.json({ success: true, result });
  } catch (err) {
    console.error("Error sending template:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// API: safe config info for the dashboard
app.get("/api/config", (req, res) => {
  res.json({
    "Phone Number ID": config.phoneNumberId || "–",
    "WABA ID": config.wabaId || "–",
    "Verify Token": config.verifyToken,
    "Puerto": config.port,
    "Token de acceso": config.accessToken ? `...${config.accessToken.slice(-6)}` : "No configurado"
  });
});

app.listen(config.port, () => {
  console.log(`WhatsApp Dashboard corriendo en http://localhost:${config.port}`);
});
