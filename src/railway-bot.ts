#!/usr/bin/env node

import { Telegraf, Context } from 'telegraf';
import * as dotenv from 'dotenv';
import * as sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { OpenAI } from 'openai';
import { PDF_VOCABULARY, KoreanWord } from './shared-vocabulary';

dotenv.config();

interface DatabaseKoreanWord {
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
  currentWord?: DatabaseKoreanWord;
  studyMode: 'quick' | 'study' | 'quiz';
  quizScore: number;
  totalQuestions: number;
  currentQuestionNumber: number;
  wrongAnswers: Array<{word: DatabaseKoreanWord, userAnswer: string}>;
}

class RailwayKoreanBot {
  private bot: Telegraf;
  private db!: Database;
  private openai: OpenAI;
  private userSessions: Map<number, UserSession> = new Map();
  private currentHourlyQuestion: { word: string; answer: string; questionType: string } | null = null;
  private isStarted: boolean = false;

  constructor() {
    this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    // Don't call setupDatabase() or setupBotCommands() here - call them in start()
  }

  private async setupDatabase() {
    // Use a writable path for Render
    const dbPath = process.env.DATABASE_PATH || '/tmp/korean_vocabulary.db';
    
    try {
      this.db = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });
    } catch (error) {
      console.error('Database setup error:', error);
      // Fallback to in-memory database for testing
      this.db = await open({
        filename: ':memory:',
        driver: sqlite3.Database
      });
      console.log('Using in-memory database as fallback');
    }

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

    // Use shared vocabulary from your PDF lessons
    for (const word of PDF_VOCABULARY) {
      await this.db.run(`
        INSERT INTO vocabulary (korean, english, difficulty)
        VALUES (?, ?, ?)
      `, [word.korean, word.english, word.difficulty]);
    }

    console.log(`✅ Loaded ${PDF_VOCABULARY.length} words from PDF into cloud database`);
  }

  private setupBotCommands() {
    // Start command
    this.bot.start((ctx) => {
      const userId = ctx.from!.id;
      this.userSessions.set(userId, {
        userId,
        studyMode: 'quick',
        quizScore: 0,
        totalQuestions: 0,
        currentQuestionNumber: 0,
        wrongAnswers: []
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
      const session: UserSession = {
        userId,
        studyMode: 'quiz',
        quizScore: 0,
        totalQuestions: 5,
        currentQuestionNumber: 1,
        wrongAnswers: []
      };
      
      this.userSessions.set(userId, session);

      ctx.reply(
        `🎯 **Quiz Mode Started!**\n\n` +
        `I'll ask you 5 questions about Korean words from your PDF.\n\n` +
        `**How it works:**\n` +
        `• Answer correctly: ✅ +1 point\n` +
        `• Answer wrong: ❌ +0 points\n` +
        `• Type "idk" or "skip": 💭 +0 points\n\n` +
        `Let's begin! 🚀`,
        { parse_mode: 'Markdown' }
      );

      setTimeout(() => this.sendQuizQuestion(ctx), 1000);
    });

    // Study mode
    this.bot.command('study', async (ctx) => {
      const userId = ctx.from!.id;
      const session = this.userSessions.get(userId) || {
        userId,
        studyMode: 'study',
        quizScore: 0,
        totalQuestions: 0,
        currentQuestionNumber: 0,
        wrongAnswers: []
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

  private async getRandomWord(): Promise<DatabaseKoreanWord | null> {
    const result = await this.db.get(
      `SELECT * FROM vocabulary ORDER BY RANDOM() LIMIT 1`
    );
    return result || null;
  }

  private async generateExampleSentence(word: DatabaseKoreanWord): Promise<string> {
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

      if (session.currentQuestionNumber > session.totalQuestions) {
        await this.endQuiz(ctx);
        return;
      }

      const word = await this.getRandomWord();
      if (!word) {
        ctx.reply('No words available for quiz. Please contact support!');
        return;
      }

      session.currentWord = word;
      this.userSessions.set(userId, session);

      // Create quiz question
      const questionType = Math.random() < 0.5 ? 'meaning' : 'word';
      
      if (questionType === 'meaning') {
        ctx.reply(
          `🎯 **Quiz Question ${session.currentQuestionNumber}/5**\n\n` +
          `What does **${word.korean}** mean?\n\n` +
          `Type your answer below! 💭\n` +
          `*Tip: Type "idk" or "skip" if you don't know*`,
          { parse_mode: 'Markdown' }
        );
      } else {
        ctx.reply(
          `🎯 **Quiz Question ${session.currentQuestionNumber}/5**\n\n` +
          `What is the Korean word for **${word.english}**?\n\n` +
          `Type your answer below! 💭\n` +
          `*Tip: Type "idk" or "skip" if you don't know*`,
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
    try {
      // Try to find the word that was asked about by looking at recent messages
      // This is a simple approach - in a real implementation, you'd store question context
      
      // For now, let's provide a helpful response that encourages using /quiz
      // where the bot can properly track the question context
      
      const responses = [
        "Good try! 💪 For interactive quizzes with proper feedback, use /quiz!",
        "Nice attempt! 🎯 Try /quiz for questions with correct answers and examples!",
        "Keep learning! 📚 Use /quiz for full interactive practice!",
        "Great effort! 🌟 Practice more with /quiz for detailed feedback!"
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      ctx.reply(randomResponse);
      
    } catch (error) {
      console.error('Error in handleHourlyQuizResponse:', error);
      // Simple fallback response
      ctx.reply("Good try! 💪 Keep practicing with /quiz for interactive questions!");
    }
  }

  private async checkQuizAnswer(ctx: Context, userAnswer: string) {
    try {
      const userId = ctx.from!.id;
      const session = this.userSessions.get(userId);
      
      if (!session || !session.currentWord) {
        return;
      }

      const word = session.currentWord;
      
      // Handle skip/idk responses
      if (userAnswer === 'idk' || userAnswer === 'skip' || userAnswer === 'i don\'t know') {
        await this.handleSkipAnswer(ctx, word);
        return;
      }

      // Check if answer is correct (handle both Korean and English answers)
      const isCorrect = this.validateAnswer(userAnswer, word);
      
      if (isCorrect) {
        await this.handleCorrectAnswer(ctx, word);
      } else {
        await this.handleIncorrectAnswer(ctx, word, userAnswer);
      }

      // Move to next question
      session.currentQuestionNumber++;
      session.currentWord = undefined;
      this.userSessions.set(userId, session);

      if (session.currentQuestionNumber <= session.totalQuestions) {
        setTimeout(() => this.sendQuizQuestion(ctx), 2000);
      } else {
        await this.endQuiz(ctx);
      }

    } catch (error) {
      console.error('Error in checkQuizAnswer:', error);
      ctx.reply('Sorry, I had trouble checking your answer. Please try again!');
    }
  }

  private validateAnswer(userAnswer: string, word: DatabaseKoreanWord): boolean {
    const normalizedUserAnswer = userAnswer.toLowerCase().trim();
    const correctEnglish = word.english.toLowerCase().trim();
    const correctKorean = word.korean.toLowerCase().trim();
    
    // Direct match
    if (normalizedUserAnswer === correctEnglish || normalizedUserAnswer === correctKorean) {
      return true;
    }
    
    // Handle common variations
    const englishVariations = [
      correctEnglish,
      correctEnglish.replace(/^to /, ''), // Remove "to " prefix
      correctEnglish.replace(/^the /, ''), // Remove "the " prefix
      correctEnglish.replace(/^a /, ''),   // Remove "a " prefix
      correctEnglish.replace(/^an /, ''),  // Remove "an " prefix
    ];
    
    return englishVariations.includes(normalizedUserAnswer);
  }

  private async handleCorrectAnswer(ctx: Context, word: DatabaseKoreanWord) {
    const userId = ctx.from!.id;
    const session = this.userSessions.get(userId)!;
    
    session.quizScore++;
    await this.updateWordStats(word.id, true);
    
    const exampleSentence = await this.generateExampleSentence(word);
    
    const feedback = 
      `✅ **Correct!** Great job!\n\n` +
      `**${word.korean}** means **${word.english}**\n\n` +
      `💬 **Example:** ${exampleSentence}\n\n` +
      `📊 **Score:** ${session.quizScore}/${session.currentQuestionNumber}`;
    
    ctx.reply(feedback, { parse_mode: 'Markdown' });
  }

  private async handleIncorrectAnswer(ctx: Context, word: DatabaseKoreanWord, userAnswer: string) {
    const userId = ctx.from!.id;
    const session = this.userSessions.get(userId)!;
    
    await this.updateWordStats(word.id, false);
    
    // Store wrong answer for review
    session.wrongAnswers.push({ word, userAnswer });
    
    const exampleSentence = await this.generateExampleSentence(word);
    
    const feedback = 
      `❌ **Not quite right.**\n\n` +
      `**Your answer:** "${userAnswer}"\n` +
      `**Correct answer:** **${word.korean}** - ${word.english}\n\n` +
      `💡 **Tip:** ${this.getHelpfulTip(word)}\n\n` +
      `💬 **Example:** ${exampleSentence}\n\n` +
      `📊 **Score:** ${session.quizScore}/${session.currentQuestionNumber}`;
    
    ctx.reply(feedback, { parse_mode: 'Markdown' });
  }

  private async handleSkipAnswer(ctx: Context, word: DatabaseKoreanWord) {
    const userId = ctx.from!.id;
    const session = this.userSessions.get(userId)!;
    
    // Store as wrong answer for review
    session.wrongAnswers.push({ word, userAnswer: 'skipped' });
    
    const exampleSentence = await this.generateExampleSentence(word);
    
    const feedback = 
      `💭 **Skipped - Here's the answer!**\n\n` +
      `**${word.korean}** means **${word.english}**\n\n` +
      `💬 **Example:** ${exampleSentence}\n\n` +
      `📊 **Score:** ${session.quizScore}/${session.currentQuestionNumber}`;
    
    ctx.reply(feedback, { parse_mode: 'Markdown' });
  }

  private getHelpfulTip(word: DatabaseKoreanWord): string {
    const tips = [
      `Try breaking down **${word.korean}** into smaller parts`,
      `Think about the context where you might use **${word.korean}**`,
      `Remember that **${word.korean}** is a ${word.difficulty} level word`,
      `Practice writing **${word.korean}** a few times`,
      `Try to make a sentence with **${word.korean}**`
    ];
    
    return tips[Math.floor(Math.random() * tips.length)];
  }

  private async endQuiz(ctx: Context) {
    const userId = ctx.from!.id;
    const session = this.userSessions.get(userId);
    
    if (!session) {
      return;
    }

    const percentage = Math.round((session.quizScore / session.totalQuestions) * 100);
    
    let summary = 
      `🎉 **Quiz Complete!**\n\n` +
      `📊 **Final Score:** ${session.quizScore}/${session.totalQuestions} (${percentage}%)\n\n`;
    
    if (session.wrongAnswers.length > 0) {
      summary += `📝 **Words to Review:**\n`;
      session.wrongAnswers.forEach((item, index) => {
        summary += `${index + 1}. **${item.word.korean}** - ${item.word.english}\n`;
      });
      summary += `\n`;
    }
    
    if (percentage >= 80) {
      summary += `🌟 **Excellent work!** You're mastering Korean!`;
    } else if (percentage >= 60) {
      summary += `👍 **Good job!** Keep practicing to improve!`;
    } else {
      summary += `💪 **Keep studying!** Practice makes perfect!`;
    }
    
    summary += `\n\n🎯 **Options:**\n` +
      `• Type /quiz to try again\n` +
      `• Type /word for a random word\n` +
      `• Type /study for more practice`;
    
    ctx.reply(summary, { parse_mode: 'Markdown' });
    
    // Clear session
    this.userSessions.delete(userId);
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

  // Method to set the current hourly question for response tracking
  public setCurrentHourlyQuestion(word: string, answer: string, questionType: string) {
    this.currentHourlyQuestion = { word, answer, questionType };
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
      if (this.isStarted) {
        console.log('⚠️ Bot is already started, skipping...');
        return;
      }
      
      console.log('🔧 Setting up database...');
      await this.setupDatabase();
      
      console.log('🔧 Setting up bot commands...');
      this.setupBotCommands();
      
      console.log('🔧 Launching bot...');
      await this.bot.launch();
      
      this.isStarted = true;
      console.log('🚀 Railway Korean Telegram Bot started successfully!');
      
    } catch (error) {
      console.error('Failed to start bot:', error);
      process.exit(1);
    }
  }

  public async stop(signal: string) {
    console.log(`🛑 Stopping bot with signal: ${signal}`);
    await this.bot.stop(signal);
  }
}

// Export for use in other files
export { RailwayKoreanBot };

// Run bot if this file is executed directly
if (require.main === module) {
  const bot = new RailwayKoreanBot();
  bot.start();
}
