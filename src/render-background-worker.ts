#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { EnhancedKoreanBot } from './enhanced-korean-bot';

dotenv.config();

async function startEnhancedBotBackgroundWorker() {
  console.log('🚀 Starting Enhanced Korean Learning Bot as Background Worker...');
  
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN environment variable is required.');
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable is required.');
    process.exit(1);
  }

  try {
    const bot = new EnhancedKoreanBot();
    
    // Add longer delay for Render's preboot process
    console.log('⏳ Waiting for Render preboot process to complete...');
    await new Promise(resolve => setTimeout(resolve, 15000)); // 15 seconds
    
    console.log('🤖 Initializing bot...');
    await bot.start();
    
    console.log('✅ Enhanced Korean Learning Bot is running as Background Worker!');
    console.log('🎯 Features available:');
    console.log('   • Adaptive quizzes with multiple types');
    console.log('   • Spaced repetition learning');
    console.log('   • Progress tracking and analytics');
    console.log('   • Korean word learning');
    console.log('   • Personalized insights');
    
    // Keep the process alive with heartbeat
    setInterval(() => {
      console.log('💓 Bot heartbeat - ' + new Date().toISOString());
    }, 300000); // Every 5 minutes
    
    // Graceful shutdown
    process.once('SIGINT', () => {
      console.log('\n🛑 Shutting down Enhanced Korean Learning Bot...');
      bot.stop();
      process.exit(0);
    });

    process.once('SIGTERM', () => {
      console.log('\n🛑 Shutting down Enhanced Korean Learning Bot...');
      bot.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start Enhanced Korean Learning Bot:', error);
    process.exit(1);
  }
}

startEnhancedBotBackgroundWorker().catch(console.error);
