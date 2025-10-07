#!/usr/bin/env node

// Simple test to check if the bot can start without errors
import * as dotenv from 'dotenv';

dotenv.config();

async function testBotStartup() {
  console.log('🧪 Testing bot startup...');
  
  try {
    // Test environment variables
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.error('❌ TELEGRAM_BOT_TOKEN is missing');
      process.exit(1);
    }
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY is missing');
      process.exit(1);
    }
    
    console.log('✅ Environment variables are set');
    
    // Test imports
    const { RailwayKoreanBot } = await import('./railway-bot');
    console.log('✅ RailwayKoreanBot imported successfully');
    
    // Test bot creation (without starting)
    const bot = new RailwayKoreanBot();
    console.log('✅ Bot instance created successfully');
    
    console.log('🎉 All tests passed! Bot should start successfully.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testBotStartup().catch(console.error);
