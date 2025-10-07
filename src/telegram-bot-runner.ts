#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { KoreanTelegramBot } from './telegram-bot';

// Load environment variables
dotenv.config();

async function main() {
  console.log('🤖 Starting Korean Telegram Bot...');
  
  // Check required environment variables
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN is required');
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY is required');
    process.exit(1);
  }

  try {
    const bot = new KoreanTelegramBot();
    await bot.start();
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

main().catch(console.error);
