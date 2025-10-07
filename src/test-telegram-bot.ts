#!/usr/bin/env node

import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';

dotenv.config();

async function testBot() {
  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
  const chatId = process.env.TELEGRAM_CHAT_ID!;
  
  console.log('🤖 Testing Telegram bot...');
  console.log(`📱 Chat ID: ${chatId}`);
  
  try {
    // Send a test message
    await bot.telegram.sendMessage(chatId, 
      `🧪 **Test Message**\n\n` +
      `This is a test from your Korean learning bot!\n\n` +
      `If you see this, the bot is working! 🎉\n\n` +
      `Try these commands:\n` +
      `• /start - Welcome message\n` +
      `• /word - Get a Korean word\n` +
      `• /quiz - Start a quiz`,
      { parse_mode: 'Markdown' }
    );
    
    console.log('✅ Test message sent successfully!');
    
  } catch (error: any) {
    console.error('❌ Failed to send test message:', error);
    
    if (error.message?.includes('chat not found')) {
      console.log('💡 Solution: Make sure you\'ve sent at least one message to the bot first!');
    } else if (error.message?.includes('bot token')) {
      console.log('💡 Solution: Check your TELEGRAM_BOT_TOKEN secret');
    }
  }
  
  process.exit(0);
}

testBot().catch(console.error);
