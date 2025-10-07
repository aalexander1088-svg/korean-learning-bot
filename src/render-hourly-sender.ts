#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { Telegraf } from 'telegraf';
import { OpenAI } from 'openai';
import { PDF_VOCABULARY, getRandomPDFWord } from './shared-vocabulary';

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
    
    // Store the correct answer for potential follow-up
    const correctAnswer = questionType === 'meaning' ? randomWord.english : 
                        questionType === 'word' ? randomWord.korean : 
                        exampleSentence.split('(')[1]?.split(')')[0]?.trim() || 'See the sentence above';
    
    console.log('✅ Hourly Korean quiz question sent successfully!');
    console.log(`📝 Question type: ${questionType}`);
    console.log(`📝 Word: ${randomWord.korean} - ${randomWord.english}`);
    console.log(`📝 Correct answer: ${correctAnswer}`);

  } catch (error) {
    console.error('❌ Failed to send hourly word:', error);
    process.exit(1);
  }
}

sendRenderHourlyWord().catch(console.error);
