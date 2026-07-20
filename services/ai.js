/**
 * Copyright 2021-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require("./config");

class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: config.geminiModel || "gemini-pro"
    });
  }

  async generateResponse(userMessage, context = {}) {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      
      const chat = this.model.startChat({
        history: context.history || [],
        generationConfig: {
          maxOutputTokens: 256,
        },
      });

      const result = await chat.sendMessage(userMessage);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Error generating AI response:", error);
      return this.getFallbackResponse();
    }
  }

  buildSystemPrompt(context) {
    const businessName = context.businessName || "Jasper's Market";
    const businessContext = context.businessContext || "a friendly grocery store";
    
    return `You are a helpful customer service assistant for ${businessName}, ${businessContext}. 
    Always be friendly, professional, and helpful. Keep responses concise and suitable for WhatsApp.
    If you cannot help with something, suggest contacting the business directly.`;
  }

  getFallbackResponse() {
    const responses = [
      "شكراً لتواصلك معنا! كيف يمكنني مساعدتك اليوم؟",
      "Thank you for reaching out! How can I help you today?",
      "نحن هنا لمساعدتك. ما احتياجاتك؟",
      "We're here to help. What can we do for you?"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

module.exports = new AIService();
