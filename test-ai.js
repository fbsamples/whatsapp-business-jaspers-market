/**
 * Test script for Google Gemini AI integration
 * Usage: node test-ai.js
 */

"use strict";

require('dotenv').config();
const config = require('./services/config');
const AIService = require('./services/ai');

async function testAI() {
  console.log('🧪 Testing Google Gemini AI Integration...\n');
  
  // Check if API key is set
  if (!config.geminiApiKey) {
    console.error('❌ Error: GEMINI_API_KEY is not set in .env file');
    process.exit(1);
  }
  
  console.log('✅ GEMINI_API_KEY is configured');
  console.log(`📱 Using model: ${config.geminiModel}\n`);
  
  try {
    // Test 1: Simple English message
    console.log('Test 1️⃣: Simple English message');
    console.log('📤 Input: "What products do you have?"');
    const response1 = await AIService.generateResponse('What products do you have?', {
      businessName: "Jasper's Market",
      businessContext: "a friendly online grocery store"
    });
    console.log(`📥 Response: ${response1}\n`);
    
    // Test 2: Arabic message
    console.log('Test 2️⃣: Arabic message');
    console.log('📤 Input: "هل لديكم خضار طازة؟"');
    const response2 = await AIService.generateResponse('هل لديكم خضار طازة؟', {
      businessName: "Jasper's Market",
      businessContext: "متجر بقالة ودود على الإنترنت"
    });
    console.log(`📥 Response: ${response2}\n`);
    
    // Test 3: Question about hours
    console.log('Test 3️⃣: Question about business hours');
    console.log('📤 Input: "What are your working hours?"');
    const response3 = await AIService.generateResponse('What are your working hours?', {
      businessName: "Jasper's Market",
      businessContext: "a friendly online grocery store"
    });
    console.log(`📥 Response: ${response3}\n`);
    
    console.log('✨ All tests completed successfully!');
    console.log('🎉 The AI service is working correctly!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    process.exit(1);
  }
}

testAI();
