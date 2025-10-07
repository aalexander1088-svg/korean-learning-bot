#!/usr/bin/env node

import { Telegraf, Context } from 'telegraf';
import * as dotenv from 'dotenv';
import * as sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { OpenAI } from 'openai';

dotenv.config();

interface KoreanWord {
  id: number;
  korean: string;
  english: string;
  difficulty: string;
  last_shown?: string;
  times_shown: number;
  times_correct: number;
}

interface UserSession {
  userId: number;
  currentWord?: KoreanWord;
  studyMode: 'quick' | 'study' | 'quiz';
  quizScore: number;
  totalQuestions: number;
}

class RailwayKoreanBot {
  private bot: Telegraf;
  private db!: Database;
  private openai: OpenAI;
  private userSessions: Map<number, UserSession> = new Map();

  constructor() {
    this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.setupDatabase();
    this.setupBotCommands();
  }

  private async setupDatabase() {
    this.db = await open({
      filename: process.env.DATABASE_PATH || '/tmp/korean_vocabulary.db',
      driver: sqlite3.Database
    });

    // Create vocabulary table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS vocabulary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        korean TEXT NOT NULL,
        english TEXT NOT NULL,
        difficulty TEXT DEFAULT 'intermediate',
        last_shown TEXT,
        times_shown INTEGER DEFAULT 0,
        times_correct INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Pre-load vocabulary from your PDF (extracted locally)
    await this.loadPDFVocabulary();
  }

  private async loadPDFVocabulary() {
    // Check if vocabulary is already loaded
    const count = await this.db.get('SELECT COUNT(*) as count FROM vocabulary');
    
    if (count.count > 0) {
      console.log(`📚 Vocabulary already loaded: ${count.count} words`);
      return;
    }

    console.log('📚 Loading PDF vocabulary into cloud database...');

    // This vocabulary was extracted from your Korean lesson PDF
    const pdfVocabulary = [
      // Basic words from your PDF
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
      
      // Intermediate words from your PDF
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
      
      // Advanced words from your PDF
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

    for (const word of pdfVocabulary) {
      await this.db.run(`
        INSERT INTO vocabulary (korean, english, difficulty)
        VALUES (?, ?, ?)
      `, [word.korean, word.english, word.difficulty]);
    }

    console.log(`✅ Loaded ${pdfVocabulary.length} words from PDF into cloud database`);
  }

  private setupBotCommands() {
    // Start command
    this.bot.start((ctx) => {
      const userId = ctx.from!.id;
      this.userSessions.set(userId, {
        userId,
        studyMode: 'quick',
        quizScore: 0,
        totalQuestions: 0
      });

      ctx.reply(
        `🇰🇷 안녕하세요! Welcome to Korean Vocabulary Bot!\n\n` +
        `I'll help you learn Korean words from your PDF lessons every hour.\n\n` +
        `📚 /word - Get a random Korean word\n` +
        `🎯 /quiz - Start a quiz session\n` +
        `📖 /study - Enter study mode\n` +
        `📊 /stats - See your learning progress\n` +
        `❓ /help - Show all commands\n\n` +
        `I'll send you a word every hour from 7 AM to 6 PM CST! 🕐`
      );
    });

    // Help command
    this.bot.help((ctx) => {
      ctx.reply(
        `🤖 Korean Vocabulary Bot Commands:\n\n` +
        `📚 /word - Get a random Korean word with example\n` +
        `🎯 /quiz - Start interactive quiz (5 questions)\n` +
        `📖 /study - Study mode (get multiple words)\n` +
        `📊 /stats - View your learning statistics\n` +
        `🔄 /reset - Reset your progress\n` +
        `❓ /help - Show this help message\n\n` +
        `💡 I'll send you a word every hour from 7 AM to 6 PM CST!`
      );
    });

    // Get a random word
    this.bot.command('word', async (ctx) => {
      await this.sendRandomWord(ctx);
    });

    // Start quiz
    this.bot.command('quiz', async (ctx) => {
      const userId = ctx.from!.id;
      const session = this.userSessions.get(userId) || {
        userId,
        studyMode: 'quiz',
        quizScore: 0,
        totalQuestions: 0
      };
      
      session.studyMode = 'quiz';
      session.quizScore = 0;
      session.totalQuestions = 0;
      this.userSessions.set(userId, session);

      ctx.reply(
        `🎯 Quiz Mode Started!\n\n` +
        `I'll ask you 5 questions about Korean words from your PDF. ` +
        `Answer correctly to improve your score!\n\n` +
        `Let's begin! 🚀`
      );

      await this.sendQuizQuestion(ctx);
    });

    // Study mode
    this.bot.command('study', async (ctx) => {
      const userId = ctx.from!.id;
      const session = this.userSessions.get(userId) || {
        userId,
        studyMode: 'study',
        quizScore: 0,
        totalQuestions: 0
      };
      
      session.studyMode = 'study';
      this.userSessions.set(userId, session);

      ctx.reply(
        `📖 Study Mode Activated!\n\n` +
        `I'll send you Korean words from your PDF with examples and explanations. ` +
        `Perfect for focused learning!\n\n` +
        `Type /word to get your first word! 📚`
      );
    });

    // Statistics
    this.bot.command('stats', async (ctx) => {
      await this.showStats(ctx);
    });

    // Reset progress
    this.bot.command('reset', async (ctx) => {
      const userId = ctx.from!.id;
      this.userSessions.delete(userId);
      
      ctx.reply(
        `🔄 Progress Reset!\n\n` +
        `Your learning progress has been reset. ` +
        `Start fresh with /word or /quiz! 🆕`
      );
    });

    // Handle text responses
    this.bot.on('text', async (ctx) => {
      await this.handleTextResponse(ctx);
    });

    // Error handling
    this.bot.catch((err, ctx) => {
      console.error('Bot error:', err);
      ctx.reply('Sorry, something went wrong! Please try again.');
    });
  }

  private async sendRandomWord(ctx: Context) {
    try {
      const word = await this.getRandomWord();
      if (!word) {
        ctx.reply('No Korean words found in database. Please contact support!');
        return;
      }

      // Update word statistics
      await this.updateWordStats(word.id);

      // Generate example sentence using OpenAI
      const exampleSentence = await this.generateExampleSentence(word);

      const message = 
        `🇰🇷 **Korean Word from Your PDF**\n\n` +
        `**${word.korean}**\n` +
        `📖 **Meaning:** ${word.english}\n` +
        `📊 **Difficulty:** ${word.difficulty}\n\n` +
        `💬 **Example:**\n${exampleSentence}\n\n` +
        `🎯 Want to practice? Type /quiz for a quiz or /study for more words!`;

      ctx.reply(message, { parse_mode: 'Markdown' });

    } catch (error) {
      console.error('Error sending random word:', error);
      ctx.reply('Sorry, I had trouble getting a word. Please try again!');
    }
  }

  private async getRandomWord(): Promise<KoreanWord | null> {
    const result = await this.db.get(
      `SELECT * FROM vocabulary ORDER BY RANDOM() LIMIT 1`
    );
    return result || null;
  }

  private async generateExampleSentence(word: KoreanWord): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a Korean language teacher. Create a simple, practical example sentence using the Korean word "${word.korean}" (${word.english}). 
            Format: Korean sentence (English translation)
            Keep it beginner-friendly and practical.`
          },
          {
            role: "user",
            content: `Create an example sentence for: ${word.korean} - ${word.english}`
          }
        ],
        max_tokens: 100,
        temperature: 0.7
      });

      return response.choices[0]?.message?.content || 
        `Example: ${word.korean}을 사용하는 문장을 만들어보세요! (Try making a sentence using ${word.korean}!)`;
    } catch (error) {
      console.error('OpenAI error:', error);
      return `Example: ${word.korean}을 사용하는 문장을 만들어보세요! (Try making a sentence using ${word.korean}!)`;
    }
  }

  private async sendQuizQuestion(ctx: Context) {
    try {
      const userId = ctx.from!.id;
      const session = this.userSessions.get(userId);
      
      if (!session || session.studyMode !== 'quiz') {
        return;
      }

      if (session.totalQuestions >= 5) {
        await this.endQuiz(ctx);
        return;
      }

      const word = await this.getRandomWord();
      if (!word) {
        ctx.reply('No words available for quiz. Please contact support!');
        return;
      }

      session.currentWord = word;
      session.totalQuestions++;
      this.userSessions.set(userId, session);

      // Create quiz question
      const questionType = Math.random() < 0.5 ? 'meaning' : 'word';
      
      if (questionType === 'meaning') {
        ctx.reply(
          `🎯 **Quiz Question ${session.totalQuestions}/5**\n\n` +
          `What does **${word.korean}** mean?\n\n` +
          `Type your answer below! 💭`,
          { parse_mode: 'Markdown' }
        );
      } else {
        ctx.reply(
          `🎯 **Quiz Question ${session.totalQuestions}/5**\n\n` +
          `What is the Korean word for **${word.english}**?\n\n` +
          `Type your answer below! 💭`,
          { parse_mode: 'Markdown' }
        );
      }

    } catch (error) {
      console.error('Error sending quiz question:', error);
      ctx.reply('Sorry, I had trouble creating a quiz question. Please try again!');
    }
  }

  private async handleTextResponse(ctx: Context) {
    const userId = ctx.from!.id;
    const session = this.userSessions.get(userId);
    const userAnswer = ctx.message && 'text' in ctx.message ? ctx.message.text.toLowerCase().trim() : '';

    if (!userAnswer) {
      return;
    }

    // Handle quiz mode responses
    if (session && session.currentWord && session.studyMode === 'quiz') {
      await this.checkQuizAnswer(ctx, userAnswer);
      return;
    }

    // Handle hourly quiz responses (when not in active quiz mode)
    if (!session || session.studyMode !== 'quiz') {
      await this.handleHourlyQuizResponse(ctx, userAnswer);
    }
  }

  private async handleHourlyQuizResponse(ctx: Context, userAnswer: string) {
    // Simple response for hourly quiz answers
    // Since we don't know the exact question, provide general feedback
    const responses = [
      "Good try! 💪 Keep practicing with /quiz for interactive questions!",
      "Nice attempt! 🎯 Try /quiz for more practice questions!",
      "Keep learning! 📚 Use /quiz for interactive practice!",
      "Great effort! 🌟 Practice more with /quiz!"
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    ctx.reply(randomResponse);
  }

  private async checkQuizAnswer(ctx: Context, userAnswer: string) {
    const userId = ctx.from!.id;
    const session = this.userSessions.get(userId);
    
    if (!session || !session.currentWord) {
      return;
    }

    const word = session.currentWord;
    const correctAnswer = word.english.toLowerCase();
    const koreanAnswer = word.korean.toLowerCase();

    let isCorrect = false;
    let feedback = '';

    // Check if answer matches English meaning or Korean word
    if (userAnswer === correctAnswer || userAnswer === koreanAnswer) {
      isCorrect = true;
      session.quizScore++;
      await this.updateWordStats(word.id, true);
      
      feedback = `✅ **Correct!** Great job!\n\n`;
    } else {
      await this.updateWordStats(word.id, false);
      
      feedback = `❌ **Not quite right.**\n\n` +
        `The correct answer is: **${word.korean}** - ${word.english}\n\n`;
    }

    feedback += `📊 **Score:** ${session.quizScore}/${session.totalQuestions}\n\n`;

    if (session.totalQuestions < 5) {
      feedback += `Next question coming up... 🎯`;
    } else {
      feedback += `🎉 **Quiz Complete!** Final score: ${session.quizScore}/5\n\n` +
        `Type /quiz to try again or /word for a random word!`;
    }

    ctx.reply(feedback, { parse_mode: 'Markdown' });

    // Clear current word and continue quiz
    session.currentWord = undefined;
    this.userSessions.set(userId, session);

    if (session.totalQuestions < 5) {
      setTimeout(() => this.sendQuizQuestion(ctx), 2000);
    }
  }

  private async endQuiz(ctx: Context) {
    const userId = ctx.from!.id;
    const session = this.userSessions.get(userId);
    
    if (!session) return;

    const percentage = Math.round((session.quizScore / session.totalQuestions) * 100);
    let message = `🎉 **Quiz Complete!**\n\n` +
      `📊 **Final Score:** ${session.quizScore}/${session.totalQuestions} (${percentage}%)\n\n`;

    if (percentage >= 80) {
      message += `🌟 **Excellent!** You're doing great with Korean vocabulary!`;
    } else if (percentage >= 60) {
      message += `👍 **Good job!** Keep practicing to improve!`;
    } else {
      message += `💪 **Keep studying!** Practice makes perfect!`;
    }

    message += `\n\nType /quiz to try again or /word for a random word!`;

    ctx.reply(message, { parse_mode: 'Markdown' });

    // Reset quiz session
    session.studyMode = 'quick';
    session.quizScore = 0;
    session.totalQuestions = 0;
    session.currentWord = undefined;
    this.userSessions.set(userId, session);
  }

  private async showStats(ctx: Context) {
    try {
      const stats = await this.db.get(`
        SELECT 
          COUNT(*) as total_words,
          AVG(times_shown) as avg_shown,
          AVG(times_correct) as avg_correct
        FROM vocabulary
      `);

      const recentWords = await this.db.all(`
        SELECT korean, english, times_shown, times_correct
        FROM vocabulary 
        WHERE times_shown > 0
        ORDER BY last_shown DESC 
        LIMIT 5
      `);

      let message = `📊 **Your Learning Statistics**\n\n` +
        `📚 **Total Words:** ${stats.total_words}\n` +
        `👀 **Average Times Shown:** ${Math.round(stats.avg_shown || 0)}\n` +
        `✅ **Average Correct:** ${Math.round(stats.avg_correct || 0)}\n\n`;

      if (recentWords.length > 0) {
        message += `🕐 **Recently Studied:**\n`;
        recentWords.forEach(word => {
          const accuracy = word.times_shown > 0 ? 
            Math.round((word.times_correct / word.times_shown) * 100) : 0;
          message += `• ${word.korean} (${word.english}) - ${accuracy}% accuracy\n`;
        });
      }

      message += `\n🎯 Keep learning with /quiz or /word!`;

      ctx.reply(message, { parse_mode: 'Markdown' });

    } catch (error) {
      console.error('Error showing stats:', error);
      ctx.reply('Sorry, I had trouble getting your statistics. Please try again!');
    }
  }

  private async updateWordStats(wordId: number, correct?: boolean): Promise<void> {
    const now = new Date().toISOString();
    
    if (correct !== undefined) {
      // Update with quiz result
      await this.db.run(`
        UPDATE vocabulary 
        SET times_shown = times_shown + 1,
            times_correct = times_correct + ${correct ? 1 : 0},
            last_shown = ?
        WHERE id = ?
      `, [now, wordId]);
    } else {
      // Just mark as shown
      await this.db.run(`
        UPDATE vocabulary 
        SET times_shown = times_shown + 1,
            last_shown = ?
        WHERE id = ?
      `, [now, wordId]);
    }
  }

  // Method for hourly automated messages
  public async sendHourlyWord(chatId: string) {
    try {
      const word = await this.getRandomWord();
      if (!word) {
        return;
      }

      await this.updateWordStats(word.id);
      const exampleSentence = await this.generateExampleSentence(word);

      const message = 
        `🕐 **Hourly Korean Word from Your PDF**\n\n` +
        `**${word.korean}**\n` +
        `📖 **Meaning:** ${word.english}\n\n` +
        `💬 **Example:**\n${exampleSentence}\n\n` +
        `🎯 Ready to practice? Type /quiz!`;

      await this.bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });

    } catch (error) {
      console.error('Error sending hourly word:', error);
    }
  }

  public async start() {
    try {
      await this.bot.launch();
      console.log('🚀 Railway Korean Telegram Bot started successfully!');
      
      // Graceful shutdown
      process.once('SIGINT', () => this.bot.stop('SIGINT'));
      process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
      
    } catch (error) {
      console.error('Failed to start bot:', error);
      process.exit(1);
    }
  }
}

// Export for use in other files
export { RailwayKoreanBot };

// Run bot if this file is executed directly
if (require.main === module) {
  const bot = new RailwayKoreanBot();
  bot.start();
}
