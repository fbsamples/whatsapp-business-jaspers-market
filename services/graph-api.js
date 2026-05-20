"use strict";

const https = require("https");
const config = require("./config");

function apiRequest(body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const options = {
      hostname: "graph.facebook.com",
      path: `/v18.0/${config.phoneNumberId}/messages`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, res => {
      let data = "";
      res.on("data", chunk => (data += chunk));
      res.on("end", () => {
        const parsed = JSON.parse(data);
        if (res.statusCode >= 400) {
          reject(new Error(parsed.error?.message || `API error ${res.statusCode}`));
        } else {
          resolve(parsed);
        }
      });
    });

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

module.exports = {
  sendTextMessage(to, text) {
    return apiRequest({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text }
    });
  },

  sendTemplate(to, templateName, languageCode, components = []) {
    return apiRequest({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components
      }
    });
  }
};
