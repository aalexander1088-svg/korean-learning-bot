#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { RailwayKoreanBot } from './railway-bot';

dotenv.config();

async function runRailwayBot() {
  console.log('🚀 Starting Railway Korean Telegram Bot...');
  
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN environment variable is required.');
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable is required.');
    process.exit(1);
  }

  const bot = new RailwayKoreanBot();
  await bot.start();
  console.log('✅ Railway Korean Telegram Bot launched successfully!');

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

runRailwayBot().catch(console.error);
