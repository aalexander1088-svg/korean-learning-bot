#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { EnhancedKoreanBot } from './enhanced-korean-bot';

dotenv.config();

async function startEnhancedBot() {
  console.log('🚀 Starting Enhanced Korean Learning Bot on Render...');
  
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
    await bot.start();
    
    // Keep the process alive
    console.log('✅ Enhanced Korean Learning Bot is running on Render!');
    console.log('🎯 Features available:');
    console.log('   • Adaptive quizzes with multiple types');
    console.log('   • Spaced repetition learning');
    console.log('   • Progress tracking and analytics');
    console.log('   • Korean word learning');
    console.log('   • Personalized insights');
    
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

startEnhancedBot().catch(console.error);
