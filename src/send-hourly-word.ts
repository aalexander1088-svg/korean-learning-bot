#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { KoreanTelegramBot } from './telegram-bot';

// Load environment variables
dotenv.config();

async function sendHourlyWord() {
  console.log('🕐 Sending hourly Korean word...');
  
  // Check required environment variables
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN is required');
    process.exit(1);
  }

  if (!process.env.TELEGRAM_CHAT_ID) {
    console.error('❌ TELEGRAM_CHAT_ID is required');
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY is required');
    process.exit(1);
  }

  try {
    const bot = new KoreanTelegramBot();
    await bot.sendHourlyWord(process.env.TELEGRAM_CHAT_ID);
    console.log('✅ Hourly Korean word sent successfully!');
  } catch (error) {
    console.error('❌ Failed to send hourly word:', error);
    process.exit(1);
  }
}

sendHourlyWord().catch(console.error);
