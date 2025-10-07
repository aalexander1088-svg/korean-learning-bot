#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { Telegraf } from 'telegraf';
import { OpenAI } from 'openai';

dotenv.config();

async function sendRenderHourlyWord() {
  console.log('🕐 Sending hourly Korean word via Render...');
  
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
    
    // Pre-loaded vocabulary from your PDF (same as in railway-bot.ts)
    const pdfVocabulary = [
      { korean: '안녕하세요', english: 'Hello', difficulty: 'beginner' },
      { korean: '감사합니다', english: 'Thank you', difficulty: 'beginner' },
      { korean: '죄송합니다', english: 'Sorry', difficulty: 'beginner' },
      { korean: '네', english: 'Yes', difficulty: 'beginner' },
      { korean: '아니요', english: 'No', difficulty: 'beginner' },
      { korean: '물', english: 'Water', difficulty: 'beginner' },
      { korean: '밥', english: 'Rice/Food', difficulty: 'beginner' },
      { korean: '집', english: 'House', difficulty: 'beginner' },
      { korean: '학교', english: 'School', difficulty: 'beginner' },
      { korean: '친구', english: 'Friend', difficulty: 'beginner' },
      { korean: '가족', english: 'Family', difficulty: 'intermediate' },
      { korean: '사랑', english: 'Love', difficulty: 'intermediate' },
      { korean: '꿈', english: 'Dream', difficulty: 'intermediate' },
      { korean: '희망', english: 'Hope', difficulty: 'intermediate' },
      { korean: '노력', english: 'Effort', difficulty: 'intermediate' },
      { korean: '성공', english: 'Success', difficulty: 'intermediate' },
      { korean: '실패', english: 'Failure', difficulty: 'intermediate' },
      { korean: '도전', english: 'Challenge', difficulty: 'intermediate' },
      { korean: '기회', english: 'Opportunity', difficulty: 'intermediate' },
      { korean: '경험', english: 'Experience', difficulty: 'intermediate' },
      { korean: '복잡한', english: 'Complicated', difficulty: 'advanced' },
      { korean: '단순하다', english: 'To be simple', difficulty: 'advanced' },
      { korean: '흡수하다', english: 'To absorb', difficulty: 'advanced' },
      { korean: '충격', english: 'Shock', difficulty: 'advanced' },
      { korean: '영향', english: 'Influence', difficulty: 'advanced' },
      { korean: '달리기', english: 'Running', difficulty: 'intermediate' },
      { korean: '그림', english: 'Painting', difficulty: 'intermediate' },
      { korean: '화가', english: 'Painter', difficulty: 'intermediate' },
      { korean: '벽', english: 'Wall', difficulty: 'intermediate' },
      { korean: '걸다', english: 'To hang', difficulty: 'intermediate' }
    ];

    // Pick a random word
    const randomWord = pdfVocabulary[Math.floor(Math.random() * pdfVocabulary.length)];
    
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

    // Create quiz-style question (3 types: word meaning, word translation, sentence)
    const questionTypes = ['meaning', 'word', 'sentence'];
    const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    let quizMessage = '';
    
    if (questionType === 'meaning') {
      // Show Korean word, ask for English meaning
      quizMessage = 
        `🕐 **Hourly Korean Quiz**\n\n` +
        `**Question:** What does **${randomWord.korean}** mean?\n\n` +
        `Type your answer below! 💭`;
    } else if (questionType === 'word') {
      // Show English word, ask for Korean translation
      quizMessage = 
        `🕐 **Hourly Korean Quiz**\n\n` +
        `**Question:** What is the Korean word for **${randomWord.english}**?\n\n` +
        `Type your answer below! 💭`;
    } else {
      // Show sentence, ask for translation
      quizMessage = 
        `🕐 **Hourly Korean Quiz**\n\n` +
        `**Question:** What does this Korean sentence mean?\n\n` +
        `**${exampleSentence.split('(')[0].trim()}**\n\n` +
        `Type your answer below! 💭`;
    }

    await bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID!, quizMessage, { parse_mode: 'Markdown' });
    
    console.log('✅ Hourly Korean word sent successfully via Render!');
    console.log(`📝 Word sent: ${randomWord.korean} - ${randomWord.english}`);

  } catch (error) {
    console.error('❌ Failed to send hourly word:', error);
    process.exit(1);
  }
}

sendRenderHourlyWord().catch(console.error);
