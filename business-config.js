/**
 * Business Configuration
 * Customize your WhatsApp bot behavior here
 */

module.exports = {
  // Business Information
  business: {
    name: "Jasper's Market",
    description: "a friendly online grocery store",
    language: "en" // 'en' or 'ar'
  },

  // AI Behavior
  ai: {
    // Maximum characters per response (WhatsApp limit)
    maxResponseLength: 256,
    
    // System prompt customization
    systemPrompt: `You are a helpful customer service assistant for Jasper's Market, a friendly online grocery store. 
    Always be friendly, professional, and helpful. Keep responses concise and suitable for WhatsApp.
    If you cannot help with something, suggest contacting the business directly.`,
    
    // Response timeout in milliseconds
    responseTimeout: 30000,
    
    // Fallback responses when AI fails
    fallbackResponses: {
      en: [
        "Thank you for reaching out! How can I help you today?",
        "We're here to help. What can we do for you?"
      ],
      ar: [
        "شكراً لتواصلك معنا! كيف يمكنني مساعدتك اليوم؟",
        "نحن هنا لمساعدتك. ما احتياجاتك؟"
      ]
    }
  },

  // Interactive Messages (old behavior)
  interactive: {
    defaultMessage: "Welcome to Jasper's Market! What can we help you with today?",
    followUpMessage: "Is there anything else we can help you with?"
  },

  // Logging
  logging: {
    enableConsoleLog: true,
    enableErrorTracking: true
  }
};
