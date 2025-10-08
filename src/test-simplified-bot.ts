#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { SimplifiedKoreanBot } from './simplified-korean-bot';

dotenv.config();

async function testBotLocally() {
  console.log('🧪 Testing Simplified Korean Bot Locally');
  console.log('==========================================');
  
  // Check environment variables
  console.log('\n🔍 Checking environment variables...');
  
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN not found in .env file');
    console.log('💡 Please add TELEGRAM_BOT_TOKEN to your .env file');
    return;
  }
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in .env file');
    console.log('💡 Please add OPENAI_API_KEY to your .env file');
    return;
  }
  
  console.log('✅ Environment variables found');
  
  try {
    console.log('\n🤖 Initializing Simplified Korean Bot...');
    const bot = new SimplifiedKoreanBot();
    
    console.log('✅ Bot initialized successfully');
    console.log('\n📋 Bot Features:');
    console.log('   • MCP Korean Learning System');
    console.log('   • Adaptive quizzes');
    console.log('   • Spaced repetition');
    console.log('   • Progress tracking');
    console.log('   • Korean word learning');
    console.log('   • Single word responses');
    
    console.log('\n🎯 Ready to start bot!');
    console.log('💡 Press Ctrl+C to stop the test');
    
    // Start the bot
    await bot.start();
    
    console.log('✅ Bot started successfully!');
    console.log('📱 Send messages to your Telegram bot to test');
    
    // Keep running for 30 seconds for testing
    setTimeout(() => {
      console.log('\n⏰ Test completed after 30 seconds');
      bot.stop();
      process.exit(0);
    }, 30000);
    
  } catch (error) {
    console.error('❌ Error testing bot:', error);
    console.log('\n💡 Common issues:');
    console.log('   • Another bot instance might be running');
    console.log('   • Check your Telegram bot token');
    console.log('   • Verify OpenAI API key');
  }
}

testBotLocally().catch(console.error);
