#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { RailwayKoreanBot } from './railway-bot';

dotenv.config();

async function healthCheck() {
  console.log('🏥 Starting health check...');
  
  // Check environment variables
  const requiredVars = ['TELEGRAM_BOT_TOKEN', 'OPENAI_API_KEY'];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      console.error(`❌ Missing environment variable: ${varName}`);
      process.exit(1);
    }
    console.log(`✅ ${varName}: ${process.env[varName]?.substring(0, 10)}...`);
  }
  
  // Test bot creation
  try {
    console.log('🔧 Creating bot instance...');
    const bot = new RailwayKoreanBot();
    console.log('✅ Bot instance created successfully');
    
    // Test database setup
    console.log('🔧 Testing database setup...');
    await bot.start();
    console.log('✅ Bot started successfully');
    
    // Stop the bot
    await bot.stop('SIGTERM');
    console.log('✅ Bot stopped successfully');
    
    console.log('🎉 Health check passed! Bot is working correctly.');
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  }
}

healthCheck().catch(console.error);
