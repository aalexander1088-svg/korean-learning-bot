#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { RailwayKoreanBot } from './railway-bot';

dotenv.config();

async function testKoreanWordLearning() {
  console.log('🧪 Testing Korean word learning...');
  
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
    
    // Test Korean text detection
    const testWords = ['합치다', '안녕하세요', '가나다라'];
    
    for (const word of testWords) {
      console.log(`\n🔍 Testing word: "${word}"`);
      
      // Test containsKoreanText
      const containsKorean = bot['containsKoreanText'](word);
      console.log(`Contains Korean: ${containsKorean}`);
      
      // Test extractKoreanWord
      const extracted = bot['extractKoreanWord'](word);
      console.log(`Extracted: "${extracted}"`);
      
      if (containsKorean && extracted) {
        console.log('✅ Korean word detection working correctly');
        
        // Test teaching generation
        try {
          const teaching = await bot['generateKoreanTeaching'](extracted);
          console.log(`📚 Teaching response generated: ${teaching.substring(0, 100)}...`);
        } catch (error) {
          console.error('❌ Error generating teaching:', error);
        }
      } else {
        console.log('❌ Korean word detection failed');
      }
    }
    
    console.log('\n✅ Korean word learning test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testKoreanWordLearning().catch(console.error);
