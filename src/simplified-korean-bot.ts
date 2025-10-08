import { Telegraf, Context } from 'telegraf';
import { MCPKoreanLearningSystem, QuizType, DifficultyLevel } from './mcp-korean-learning';
import { OpenAI } from 'openai';

interface UserSession {
  userId: string;
  currentQuiz?: any;
  currentQuestionIndex?: number;
  studyMode: 'learning' | 'quiz' | 'review';
  difficulty: DifficultyLevel;
  quizType: QuizType;
}

export class SimplifiedKoreanBot {
  private bot: Telegraf;
  private mcpSystem: MCPKoreanLearningSystem;
  private openai: OpenAI;
  private userSessions: Map<number, UserSession>;

  constructor() {
    this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
    this.mcpSystem = new MCPKoreanLearningSystem();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
    this.userSessions = new Map();
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Start command
    this.bot.start(async (ctx) => {
      const userId = ctx.from!.id;
      await this.initializeUser(userId);
      
      const welcomeMessage = `
🇰🇷 **Welcome to Enhanced Korean Learning Bot!** 🇰🇷

I'm your personal Korean learning assistant with advanced features:

📚 **Learning Modes:**
• Send any Korean word to learn its meaning and usage
• Take adaptive quizzes tailored to your level
• Review words using spaced repetition

🎯 **Quiz Types:**
• Vocabulary (Korean ↔ English)
• Grammar patterns
• Sentence completion
• Fill-in-the-blank

📊 **Progress Tracking:**
• Track your learning progress
• Get personalized insights
• Identify weak areas

**Commands:**
/quiz - Start a quiz
/progress - View your progress
/insights - Get learning insights
/level - Set your difficulty level
/help - Show all commands

**Just send any Korean word to start learning!** ✨
      `;
      
      ctx.reply(welcomeMessage, { parse_mode: 'Markdown' });
    });

    // Quiz command
    this.bot.command('quiz', async (ctx) => {
      await this.handleQuizCommand(ctx);
    });

    // Progress command
    this.bot.command('progress', async (ctx) => {
      await this.handleProgressCommand(ctx);
    });

    // Insights command
    this.bot.command('insights', async (ctx) => {
      await this.handleInsightsCommand(ctx);
    });

    // Level command
    this.bot.command('level', async (ctx) => {
      await this.handleLevelCommand(ctx);
    });

    // Help command
    this.bot.command('help', async (ctx) => {
      await this.handleHelpCommand(ctx);
    });

    // Text handler for Korean words and quiz answers
    this.bot.on('text', async (ctx) => {
      await this.handleTextMessage(ctx);
    });

    // Callback query handler for quiz buttons
    this.bot.on('callback_query', async (ctx) => {
      await this.handleCallbackQuery(ctx);
    });
  }

  private async initializeUser(telegramId: number): Promise<void> {
    try {
      const existingProfile = await this.mcpSystem.getUserProfile(telegramId);
      
      if (!existingProfile) {
        await this.mcpSystem.createUserProfile(telegramId);
        console.log(`✅ Created new user profile for ${telegramId}`);
      }

      // Initialize user session
      const session: UserSession = {
        userId: `user_${telegramId}`,
        studyMode: 'learning',
        difficulty: 'beginner',
        quizType: 'mixed'
      };
      
      this.userSessions.set(telegramId, session);
      
    } catch (error) {
      console.error('Error initializing user:', error);
    }
  }

  private async handleQuizCommand(ctx: Context): Promise<void> {
    try {
      const userId = ctx.from!.id;
      const session = this.userSessions.get(userId);
      
      if (!session) {
        await this.initializeUser(userId);
        return;
      }

      // Show quiz type selection
      const quizTypes = [
        { text: '📚 Vocabulary (Korean → English)', callback_data: 'quiz_vocab_kr_en' },
        { text: '📚 Vocabulary (English → Korean)', callback_data: 'quiz_vocab_en_kr' },
        { text: '📝 Grammar Patterns', callback_data: 'quiz_grammar' },
        { text: '✍️ Sentence Completion', callback_data: 'quiz_sentence' },
        { text: '🎯 Mixed Quiz', callback_data: 'quiz_mixed' }
      ];

      const difficultyButtons = [
        { text: '🟢 Beginner', callback_data: 'difficulty_beginner' },
        { text: '🟡 Intermediate', callback_data: 'difficulty_intermediate' },
        { text: '🔴 Advanced', callback_data: 'difficulty_advanced' }
      ];

      const message = `
🎯 **Choose Your Quiz Type**

Select the type of quiz you'd like to take:

**Quiz Types:**
• Vocabulary quizzes test your word knowledge
• Grammar quizzes focus on sentence patterns
• Sentence completion tests your understanding
• Mixed quizzes combine all types

**Difficulty Levels:**
• Beginner: Basic vocabulary and simple grammar
• Intermediate: Common phrases and compound sentences  
• Advanced: Complex grammar and idiomatic expressions

Choose a quiz type to continue! 🚀
      `;

      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            quizTypes.map(type => ({ text: type.text, callback_data: type.callback_data })),
            difficultyButtons.map(diff => ({ text: diff.text, callback_data: diff.callback_data }))
          ]
        }
      });

    } catch (error) {
      console.error('Error handling quiz command:', error);
      ctx.reply('Sorry, I had trouble setting up the quiz. Please try again!');
    }
  }

  private async handleCallbackQuery(ctx: Context): Promise<void> {
    try {
      const callbackData = (ctx.callbackQuery as any).data;
      const userId = ctx.from!.id;
      const session = this.userSessions.get(userId);

      if (!session) {
        await ctx.answerCbQuery('Please start the bot first with /start');
        return;
      }

      if (callbackData.startsWith('quiz_')) {
        // Handle quiz type selection
        const quizType = callbackData.replace('quiz_', '').replace('_', '_') as QuizType;
        session.quizType = quizType;
        this.userSessions.set(userId, session);
        
        await ctx.answerCbQuery(`Selected ${quizType} quiz!`);
        await ctx.reply(`✅ Quiz type selected: ${quizType}\n\nNow choose your difficulty level!`);
        
      } else if (callbackData.startsWith('difficulty_')) {
        // Handle difficulty selection and start quiz
        const difficulty = callbackData.replace('difficulty_', '') as DifficultyLevel;
        session.difficulty = difficulty;
        this.userSessions.set(userId, session);
        
        await ctx.answerCbQuery(`Starting ${difficulty} quiz!`);
        await this.startQuiz(ctx, session);
        
      } else if (callbackData.startsWith('answer_')) {
        // Handle quiz answer
        await this.handleQuizAnswer(ctx, callbackData);
      }

    } catch (error) {
      console.error('Error handling callback query:', error);
      await ctx.answerCbQuery('Sorry, something went wrong!');
    }
  }

  private async startQuiz(ctx: Context, session: UserSession): Promise<void> {
    try {
      const userId = ctx.from!.id;
      
      // Generate adaptive quiz
      const quiz = await this.mcpSystem.generateAdaptiveQuiz(
        session.userId,
        session.quizType,
        session.difficulty,
        5 // Start with 5 questions
      );

      session.currentQuiz = quiz;
      session.currentQuestionIndex = 0;
      session.studyMode = 'quiz';
      this.userSessions.set(userId, session);

      // Send first question
      await this.sendQuizQuestion(ctx, quiz.questions[0], 1, quiz.totalQuestions);

    } catch (error) {
      console.error('Error starting quiz:', error);
      ctx.reply('Sorry, I had trouble creating the quiz. Please try again!');
    }
  }

  private async sendQuizQuestion(ctx: Context, question: any, questionNum: number, totalQuestions: number): Promise<void> {
    try {
      let message = `📝 **Question ${questionNum}/${totalQuestions}**\n\n`;
      message += `${question.question}\n\n`;

      if (question.options && question.options.length > 0) {
        // Multiple choice question
        const buttons = question.options.map((option: string, index: number) => ({
          text: `${String.fromCharCode(65 + index)}. ${option}`,
          callback_data: `answer_${index}`
        }));

        await ctx.reply(message, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [buttons]
          }
        });
      } else {
        // Fill-in-the-blank question
        message += `Type your answer below:`;
        await ctx.reply(message, { parse_mode: 'Markdown' });
      }

    } catch (error) {
      console.error('Error sending quiz question:', error);
      ctx.reply('Sorry, I had trouble sending the question. Please try again!');
    }
  }

  private async handleQuizAnswer(ctx: Context, callbackData: string): Promise<void> {
    try {
      const userId = ctx.from!.id;
      const session = this.userSessions.get(userId);
      
      if (!session || !session.currentQuiz || session.currentQuestionIndex === undefined) {
        await ctx.answerCbQuery('No active quiz found!');
        return;
      }

      const quiz = session.currentQuiz;
      const currentQuestion = quiz.questions[session.currentQuestionIndex];
      const selectedIndex = parseInt(callbackData.replace('answer_', ''));
      const userAnswer = currentQuestion.options[selectedIndex];
      const isCorrect = userAnswer === currentQuestion.correctAnswer;

      // Update question with user's answer
      currentQuestion.userAnswer = userAnswer;
      currentQuestion.isCorrect = isCorrect;

      // Update quiz score
      if (isCorrect) {
        quiz.score++;
      }

      // Send feedback
      let feedbackMessage = '';
      if (isCorrect) {
        feedbackMessage = `✅ **Correct!** Great job!\n\n`;
      } else {
        feedbackMessage = `❌ **Incorrect.** The correct answer is: **${currentQuestion.correctAnswer}**\n\n`;
      }

      if (currentQuestion.explanation) {
        feedbackMessage += `💡 **Explanation:** ${currentQuestion.explanation}\n\n`;
      }

      await ctx.reply(feedbackMessage, { parse_mode: 'Markdown' });

      // Move to next question
      session.currentQuestionIndex++;
      
      if (session.currentQuestionIndex < quiz.questions.length) {
        // Send next question
        setTimeout(() => {
          this.sendQuizQuestion(ctx, quiz.questions[session.currentQuestionIndex!], 
            session.currentQuestionIndex! + 1, quiz.totalQuestions);
        }, 2000);
      } else {
        // Quiz completed
        await this.completeQuiz(ctx, quiz);
      }

      this.userSessions.set(userId, session);

    } catch (error) {
      console.error('Error handling quiz answer:', error);
      await ctx.answerCbQuery('Sorry, something went wrong!');
    }
  }

  private async completeQuiz(ctx: Context, quiz: any): Promise<void> {
    try {
      const userId = ctx.from!.id;
      const session = this.userSessions.get(userId);
      
      if (!session) return;

      const accuracy = (quiz.score / quiz.totalQuestions) * 100;
      
      // Update learning progress
      await this.mcpSystem.updateLearningProgress(session.userId, quiz);

      let completionMessage = `
🎉 **Quiz Completed!** 🎉

📊 **Your Results:**
• Score: ${quiz.score}/${quiz.totalQuestions}
• Accuracy: ${accuracy.toFixed(1)}%
• Quiz Type: ${quiz.quizType}
• Difficulty: ${quiz.difficulty}

`;

      if (accuracy >= 80) {
        completionMessage += `🌟 **Excellent work!** You're mastering Korean!`;
      } else if (accuracy >= 60) {
        completionMessage += `👍 **Good job!** Keep practicing to improve!`;
      } else {
        completionMessage += `💪 **Keep trying!** Practice makes perfect!`;
      }

      completionMessage += `\n\nUse /quiz to take another quiz or send a Korean word to learn!`;

      await ctx.reply(completionMessage, { parse_mode: 'Markdown' });

      // Reset session
      session.currentQuiz = undefined;
      session.currentQuestionIndex = undefined;
      session.studyMode = 'learning';
      this.userSessions.set(userId, session);

    } catch (error) {
      console.error('Error completing quiz:', error);
      ctx.reply('Quiz completed! Use /quiz to take another one!');
    }
  }

  private async handleProgressCommand(ctx: Context): Promise<void> {
    try {
      const userId = ctx.from!.id;
      const profile = await this.mcpSystem.getUserProfile(userId);
      
      if (!profile) {
        await ctx.reply('Please start the bot first with /start');
        return;
      }

      const progress = await this.mcpSystem.getLearningProgress(profile.id);
      
      const progressMessage = `
📊 **Your Learning Progress**

👤 **Profile:**
• Level: ${profile.level.charAt(0).toUpperCase() + profile.level.slice(1)}
• Study Streak: ${profile.streak} days
• Total Study Time: ${profile.totalStudyTime} minutes

📈 **Statistics:**
• Quiz Sessions Completed: ${progress.quizSessionsCompleted}
• Average Accuracy: ${(progress.averageAccuracy * 100).toFixed(1)}%
• Vocabulary Mastered: ${progress.vocabularyMastered}
• Grammar Patterns Learned: ${progress.grammarPatternsLearned}

🎯 **Current Status:**
• Last Study Date: ${new Date(progress.lastStudyDate).toLocaleDateString()}
• Next Review Date: ${new Date(progress.nextReviewDate).toLocaleDateString()}

Use /insights for detailed learning analysis! 📊
      `;

      await ctx.reply(progressMessage, { parse_mode: 'Markdown' });

    } catch (error) {
      console.error('Error handling progress command:', error);
      ctx.reply('Sorry, I had trouble getting your progress. Please try again!');
    }
  }

  private async handleInsightsCommand(ctx: Context): Promise<void> {
    try {
      const userId = ctx.from!.id;
      const profile = await this.mcpSystem.getUserProfile(userId);
      
      if (!profile) {
        await ctx.reply('Please start the bot first with /start');
        return;
      }

      const insights = await this.mcpSystem.generateLearningInsights(profile.id);
      
      let insightsMessage = `
🧠 **Learning Insights & Analytics**

📊 **Overall Progress:**
• Quiz Sessions: ${insights.overallProgress.quizSessionsCompleted}
• Average Accuracy: ${(insights.overallProgress.averageAccuracy * 100).toFixed(1)}%
• Study Streak: ${insights.overallProgress.streakDays} days

📈 **Recent Performance:**
• Average Score: ${(insights.recentPerformance.averageScore * 100).toFixed(1)}%
• Trend: ${insights.recentPerformance.trend}

`;

      if (insights.weakAreas.length > 0) {
        insightsMessage += `🎯 **Areas to Focus On:**\n`;
        insights.weakAreas.slice(0, 5).forEach((word: any, index: number) => {
          insightsMessage += `${index + 1}. ${word.korean} (${word.english})\n`;
        });
        insightsMessage += `\n`;
      }

      if (insights.recommendations.length > 0) {
        insightsMessage += `💡 **Recommendations:**\n`;
        insights.recommendations.forEach((rec: string, index: number) => {
          insightsMessage += `${index + 1}. ${rec}\n`;
        });
      }

      insightsMessage += `\nKeep up the great work! Use /quiz to practice more! 🚀`;

      await ctx.reply(insightsMessage, { parse_mode: 'Markdown' });

    } catch (error) {
      console.error('Error handling insights command:', error);
      ctx.reply('Sorry, I had trouble generating insights. Please try again!');
    }
  }

  private async handleLevelCommand(ctx: Context): Promise<void> {
    try {
      const userId = ctx.from!.id;
      const session = this.userSessions.get(userId);
      
      if (!session) {
        await ctx.reply('Please start the bot first with /start');
        return;
      }

      const levelButtons = [
        { text: '🟢 Beginner', callback_data: 'set_level_beginner' },
        { text: '🟡 Intermediate', callback_data: 'set_level_intermediate' },
        { text: '🔴 Advanced', callback_data: 'set_level_advanced' }
      ];

      const message = `
🎯 **Set Your Difficulty Level**

Choose your current Korean proficiency level:

• **Beginner**: Basic vocabulary and simple grammar
• **Intermediate**: Common phrases and compound sentences
• **Advanced**: Complex grammar and idiomatic expressions

This will help me create quizzes and content appropriate for your level! 📚
      `;

      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [levelButtons]
        }
      });

    } catch (error) {
      console.error('Error handling level command:', error);
      ctx.reply('Sorry, I had trouble setting your level. Please try again!');
    }
  }

  private async handleHelpCommand(ctx: Context): Promise<void> {
    const helpMessage = `
🇰🇷 **Korean Learning Bot Help** 🇰🇷

**Main Features:**
• Send any Korean word to learn its meaning and usage
• Take adaptive quizzes tailored to your level
• Track your learning progress and get insights

**Commands:**
/start - Initialize the bot and see welcome message
/quiz - Start a quiz (vocabulary, grammar, mixed)
/progress - View your learning progress
/insights - Get detailed learning analytics
/level - Set your difficulty level
/help - Show this help message

**Quiz Types:**
📚 Vocabulary (Korean ↔ English)
📝 Grammar patterns
✍️ Sentence completion
🎯 Mixed quizzes

**Learning Modes:**
• **Learning**: Send Korean words to learn
• **Quiz**: Take interactive quizzes
• **Review**: Review words using spaced repetition

**Tips:**
• Study regularly to maintain your streak
• Take quizzes to identify weak areas
• Send Korean words you encounter to learn them
• Use /insights to track your improvement

Happy learning! 🚀
    `;

    await ctx.reply(helpMessage, { parse_mode: 'Markdown' });
  }

  private async handleTextMessage(ctx: Context): Promise<void> {
    try {
      const userId = ctx.from!.id;
      const session = this.userSessions.get(userId);
      const userText = ctx.message && 'text' in ctx.message ? ctx.message.text : '';

      if (!userText) return;

      // Check if user is in quiz mode
      if (session && session.studyMode === 'quiz') {
        // Handle fill-in-the-blank quiz answers
        await this.handleFillInBlankAnswer(ctx, userText);
        return;
      }

      // Check if text contains Korean characters
      if (this.containsKoreanText(userText)) {
        await this.handleKoreanWordLearning(ctx, userText);
        return;
      }

      // Handle other text responses
      await this.handleGeneralResponse(ctx, userText);

    } catch (error) {
      console.error('Error handling text message:', error);
      ctx.reply('Sorry, I had trouble processing your message. Please try again!');
    }
  }

  private async handleFillInBlankAnswer(ctx: Context, userAnswer: string): Promise<void> {
    try {
      const userId = ctx.from!.id;
      const session = this.userSessions.get(userId);
      
      if (!session || !session.currentQuiz || session.currentQuestionIndex === undefined) {
        return;
      }

      const quiz = session.currentQuiz;
      const currentQuestion = quiz.questions[session.currentQuestionIndex];
      
      // Check if it's a fill-in-the-blank question
      if (currentQuestion.type === 'fill_in_blank') {
        const isCorrect = userAnswer.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim();
        
        currentQuestion.userAnswer = userAnswer;
        currentQuestion.isCorrect = isCorrect;

        if (isCorrect) {
          quiz.score++;
        }

        // Send feedback
        let feedbackMessage = '';
        if (isCorrect) {
          feedbackMessage = `✅ **Correct!** Great job!\n\n`;
        } else {
          feedbackMessage = `❌ **Incorrect.** The correct answer is: **${currentQuestion.correctAnswer}**\n\n`;
        }

        if (currentQuestion.explanation) {
          feedbackMessage += `💡 **Explanation:** ${currentQuestion.explanation}\n\n`;
        }

        await ctx.reply(feedbackMessage, { parse_mode: 'Markdown' });

        // Move to next question
        session.currentQuestionIndex++;
        
        if (session.currentQuestionIndex < quiz.questions.length) {
          setTimeout(() => {
            this.sendQuizQuestion(ctx, quiz.questions[session.currentQuestionIndex!], 
              session.currentQuestionIndex! + 1, quiz.totalQuestions);
          }, 2000);
        } else {
          await this.completeQuiz(ctx, quiz);
        }

        this.userSessions.set(userId, session);
      }

    } catch (error) {
      console.error('Error handling fill-in-blank answer:', error);
      ctx.reply('Sorry, I had trouble processing your answer. Please try again!');
    }
  }

  private async handleKoreanWordLearning(ctx: Context, koreanText: string): Promise<void> {
    try {
      const userId = ctx.from!.id;
      const koreanWord = this.extractKoreanWord(koreanText);
      
      if (!koreanWord) {
        ctx.reply('Please send a valid Korean word! 🇰🇷');
        return;
      }

      // Generate teaching response using OpenAI
      const teachingResponse = await this.generateKoreanTeaching(koreanWord);
      
      // Send response
      ctx.reply(teachingResponse, { parse_mode: 'Markdown' });
      
    } catch (error) {
      console.error('Error handling Korean word learning:', error);
      ctx.reply('Sorry, I had trouble processing that Korean word. Please try again!');
    }
  }

  private async handleGeneralResponse(ctx: Context, userText: string): Promise<void> {
    // Handle general responses or commands
    const responses = [
      "I'm here to help you learn Korean! Send a Korean word to learn, or use /quiz to practice! 🇰🇷",
      "Try sending a Korean word to learn its meaning, or use /quiz for interactive practice! 📚",
      "Use /help to see all available commands, or send a Korean word to start learning! ✨"
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    ctx.reply(randomResponse);
  }

  private containsKoreanText(text: string): boolean {
    return /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(text);
  }

  private extractKoreanWord(text: string): string {
    return text.replace(/[^\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/g, '').trim();
  }

  private async generateKoreanTeaching(koreanWord: string): Promise<string> {
    try {
      const prompt = `You are an expert Korean language teacher. For EVERY message you receive:

1. ALWAYS provide the Korean word, English meaning, and pronunciation
2. ALWAYS include 3-5 practical example sentences using casual, everyday Korean
3. ALWAYS explain grammar patterns or word structure when relevant
4. ALWAYS provide cultural context or usage tips when helpful
5. ALWAYS end with an encouraging message

Korean word: "${koreanWord}"

Format your response as:
🇰🇷 Korean Word Practice 🇰🇷

### Word Presentation
- Korean Word: [word]
- Primary Meaning: [meaning]
- Pronunciation: [pronunciation]

### Usage Examples
- [example 1 with translation]
- [example 2 with translation]
- [example 3 with translation]

### Grammar Notes
- [grammar explanation if relevant]

### Practice Sentence
- [Korean sentence with translation]

Keep it educational, encouraging, and practical for Korean learners.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert Korean language teacher. Always be encouraging and provide practical, useful information.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      return completion.choices[0]?.message?.content || 'Sorry, I had trouble generating the teaching content. Please try again!';

    } catch (error) {
      console.error('Error generating Korean teaching:', error);
      return `🇰🇷 **Korean Word Practice** 🇰🇷\n\n**${koreanWord}**\n\nI'm having trouble generating detailed information right now, but you can look up this word in a Korean dictionary! Keep learning! 💪`;
    }
  }

  public async start(): Promise<void> {
    try {
      console.log('🚀 Starting Simplified Korean Learning Bot...');
      await this.bot.launch();
      console.log('✅ Simplified Korean Learning Bot is running!');
    } catch (error) {
      console.error('❌ Failed to start Simplified Korean Learning Bot:', error);
      throw error;
    }
  }

  public stop(): void {
    this.bot.stop();
    console.log('🛑 Simplified Korean Learning Bot stopped');
  }
}
