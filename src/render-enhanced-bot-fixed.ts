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
    // Add a delay to ensure any previous bot instances are fully stopped
    console.log('⏳ Waiting for previous bot instances to stop...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const bot = new EnhancedKoreanBot();
    
    // Add retry logic for bot conflicts
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        await bot.start();
        break; // Success, exit retry loop
      } catch (error: any) {
        if (error.response?.error_code === 409) {
          retryCount++;
          console.log(`⚠️ Bot conflict detected (attempt ${retryCount}/${maxRetries})`);
          console.log('⏳ Waiting 10 seconds before retry...');
          await new Promise(resolve => setTimeout(resolve, 10000));
          
          if (retryCount >= maxRetries) {
            console.error('❌ Failed to start bot after multiple attempts due to conflicts');
            console.error('💡 Please manually stop all other bot services on Render');
            process.exit(1);
          }
        } else {
          throw error; // Re-throw non-conflict errors
        }
      }
    }
    
    console.log('✅ Enhanced Korean Learning Bot is running on Render!');
    console.log('🎯 Features available:');
    console.log('   • Adaptive quizzes with multiple types');
    console.log('   • Spaced repetition learning');
    console.log('   • Progress tracking and analytics');
    console.log('   • Korean word learning');
    console.log('   • Personalized insights');
    
    // Keep the process alive
    setInterval(() => {
      // Heartbeat to keep the process alive
    }, 30000);
    
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
