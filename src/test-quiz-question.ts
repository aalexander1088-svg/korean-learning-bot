#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { Telegraf } from 'telegraf';
import { OpenAI } from 'openai';
import { getRandomPDFWord } from './shared-vocabulary';

dotenv.config();

async function testQuizQuestion() {
  console.log('🧪 Testing quiz question format...');
  
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
    
    // Pick a random word from your PDF vocabulary
    const randomWord = getRandomPDFWord();
    
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

    // Create quiz-style question with immediate answer and example
    const questionTypes = ['meaning', 'word', 'sentence'];
    const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    let quizMessage = '';
    
    if (questionType === 'meaning') {
      // Show Korean word, ask for English meaning
      quizMessage = 
        `🧪 **Test Quiz Question**\n\n` +
        `**Question:** What does **${randomWord.korean}** mean?\n\n` +
        `**Answer:** ${randomWord.english}\n\n` +
        `💬 **Example:** ${exampleSentence}\n\n` +
        `🎯 Try to remember this word! Use /quiz for interactive practice!`;
    } else if (questionType === 'word') {
      // Show English word, ask for Korean translation
      quizMessage = 
        `🧪 **Test Quiz Question**\n\n` +
        `**Question:** What is the Korean word for **${randomWord.english}**?\n\n` +
        `**Answer:** ${randomWord.korean}\n\n` +
        `💬 **Example:** ${exampleSentence}\n\n` +
        `🎯 Try to remember this word! Use /quiz for interactive practice!`;
    } else {
      // Show sentence, ask for translation
      const sentenceAnswer = exampleSentence.split('(')[1]?.split(')')[0]?.trim() || 'See the sentence above';
      quizMessage = 
        `🧪 **Test Quiz Question**\n\n` +
        `**Question:** What does this Korean sentence mean?\n\n` +
        `**${exampleSentence.split('(')[0].trim()}**\n\n` +
        `**Answer:** ${sentenceAnswer}\n\n` +
        `🎯 Try to remember this sentence! Use /quiz for interactive practice!`;
    }

    await bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID!, quizMessage, { parse_mode: 'Markdown' });
    
    console.log('✅ Test quiz question sent successfully!');
    console.log(`📝 Question type: ${questionType}`);
    console.log(`📝 Word: ${randomWord.korean} - ${randomWord.english}`);

  } catch (error) {
    console.error('❌ Failed to send test quiz question:', error);
    process.exit(1);
  }
}

testQuizQuestion().catch(console.error);
