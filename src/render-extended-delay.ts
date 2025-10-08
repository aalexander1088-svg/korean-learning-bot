#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { EnhancedKoreanBot } from './enhanced-korean-bot';

dotenv.config();

async function startEnhancedBotWithLongDelay() {
  console.log('🚀 Starting Enhanced Korean Learning Bot with Extended Delay...');
  
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
    
    // Extended delay to ensure any other instances are fully stopped
    console.log('⏳ Waiting 60 seconds for all other bot instances to stop...');
    await new Promise(resolve => setTimeout(resolve, 60000)); // 60 seconds
    
    console.log('🤖 Initializing bot...');
    await bot.start();
    
    console.log('✅ Enhanced Korean Learning Bot is running!');
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
    console.error('💡 This might be due to another bot instance still running.');
    console.error('💡 Please check:');
    console.error('   • All Render services are stopped');
    console.error('   • No local bot processes running');
    console.error('   • Wait 5 minutes before retrying');
    process.exit(1);
  }
}

startEnhancedBotWithLongDelay().catch(console.error);
