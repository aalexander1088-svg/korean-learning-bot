#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { RailwayKoreanBot } from './railway-bot';

dotenv.config();

async function sendUnifiedHourlyMessage() {
  console.log('🚀 Starting unified hourly Korean message...');
  
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN environment variable is required.');
    process.exit(1);
  }

  if (!process.env.TELEGRAM_CHAT_ID) {
    console.error('❌ TELEGRAM_CHAT_ID environment variable is required.');
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable is required.');
    process.exit(1);
  }

  try {
    const bot = new RailwayKoreanBot();
    
    // Send hourly quiz (alternate between word and quiz)
    const shouldSendQuiz = Math.random() < 0.5;
    
    if (shouldSendQuiz) {
      console.log('📝 Sending hourly quiz...');
      await bot.sendHourlyQuiz(process.env.TELEGRAM_CHAT_ID);
    } else {
      console.log('📚 Sending hourly word...');
      await bot.sendHourlyWord(process.env.TELEGRAM_CHAT_ID);
    }
    
    console.log('✅ Unified hourly Korean message sent successfully!');
    
  } catch (error) {
    console.error('❌ Failed to send unified hourly message:', error);
    process.exit(1);
  }
}

sendUnifiedHourlyMessage().catch(console.error);
