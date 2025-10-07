#!/usr/bin/env node

import { Telegraf, Context } from 'telegraf';
import * as dotenv from 'dotenv';

dotenv.config();

async function getChatId() {
  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
  
  console.log('🤖 Bot is listening for messages...');
  console.log('📱 Please send ANY message to your bot: https://t.me/KoreanvocgramBot');
  console.log('⏳ Waiting for your message...\n');

  bot.on('message', (ctx: Context) => {
    const chatId = ctx.chat?.id;
    const username = ctx.from?.username || 'No username';
    const firstName = ctx.from?.first_name || 'No name';
    const messageText = ctx.message && 'text' in ctx.message ? ctx.message.text : 'No text';
    
    console.log('✅ Message received!');
    console.log(`👤 From: ${firstName} (@${username})`);
    console.log(`🆔 Your Chat ID: ${chatId}`);
    console.log(`📝 Message: ${messageText}`);
    console.log('\n🎉 SUCCESS! Copy this Chat ID:');
    console.log(`TELEGRAM_CHAT_ID = ${chatId}`);
    console.log('\nNow add this as a GitHub secret and you\'re all set!');
    
    process.exit(0);
  });

  try {
    await bot.launch();
    console.log('Bot started successfully!');
  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
}

getChatId().catch(console.error);
