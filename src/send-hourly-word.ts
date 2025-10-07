#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { Telegraf } from 'telegraf';
import { OpenAI } from 'openai';

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
    const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // Sample Korean words (since we can't access the database in GitHub Actions)
    const sampleWords = [
      { korean: '안녕하세요', english: 'Hello', pronunciation: 'annyeonghaseyo' },
      { korean: '감사합니다', english: 'Thank you', pronunciation: 'gamsahamnida' },
      { korean: '죄송합니다', english: 'Sorry', pronunciation: 'joesonghamnida' },
      { korean: '네', english: 'Yes', pronunciation: 'ne' },
      { korean: '아니요', english: 'No', pronunciation: 'aniyo' },
      { korean: '물', english: 'Water', pronunciation: 'mul' },
      { korean: '밥', english: 'Rice/Food', pronunciation: 'bap' },
      { korean: '집', english: 'House', pronunciation: 'jip' },
      { korean: '학교', english: 'School', pronunciation: 'hakgyo' },
      { korean: '친구', english: 'Friend', pronunciation: 'chingu' },
      { korean: '가족', english: 'Family', pronunciation: 'gajok' },
      { korean: '사랑', english: 'Love', pronunciation: 'sarang' },
      { korean: '꿈', english: 'Dream', pronunciation: 'kkum' },
      { korean: '희망', english: 'Hope', pronunciation: 'huimang' },
      { korean: '노력', english: 'Effort', pronunciation: 'noryeok' }
    ];

    // Pick a random word
    const randomWord = sampleWords[Math.floor(Math.random() * sampleWords.length)];
    
    // Generate example sentence using OpenAI
    let exampleSentence = '';
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a Korean language teacher. Create a simple, practical example sentence using the Korean word "${randomWord.korean}" (${randomWord.english}). 
            Format: Korean sentence (English translation)
            Keep it beginner-friendly and practical.`
          },
          {
            role: "user",
            content: `Create an example sentence for: ${randomWord.korean} - ${randomWord.english}`
          }
        ],
        max_tokens: 100,
        temperature: 0.7
      });

      exampleSentence = response.choices[0]?.message?.content || 
        `Example: ${randomWord.korean}을 사용하는 문장을 만들어보세요! (Try making a sentence using ${randomWord.korean}!)`;
    } catch (error) {
      console.error('OpenAI error:', error);
      exampleSentence = `Example: ${randomWord.korean}을 사용하는 문장을 만들어보세요! (Try making a sentence using ${randomWord.korean}!)`;
    }

    const message = 
      `🕐 **Hourly Korean Word**\n\n` +
      `**${randomWord.korean}** (${randomWord.pronunciation})\n` +
      `📖 **Meaning:** ${randomWord.english}\n\n` +
      `💬 **Example:**\n${exampleSentence}\n\n` +
      `🎯 Ready to practice? Type /quiz!`;

    await bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID, message, { parse_mode: 'Markdown' });
    
    console.log('✅ Hourly Korean word sent successfully!');
    console.log(`📝 Word sent: ${randomWord.korean} - ${randomWord.english}`);

  } catch (error) {
    console.error('❌ Failed to send hourly word:', error);
    process.exit(1);
  }
}

sendHourlyWord().catch(console.error);
