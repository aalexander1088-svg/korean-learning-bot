import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import { OpenAI } from 'openai';

// Enhanced interfaces for MCP integration
export interface UserProfile {
  id: string;
  telegramId: number;
  name?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  joinDate: string;
  totalStudyTime: number; // in minutes
  streak: number;
  preferredStudyTime?: string;
  learningGoals: string[];
}

export interface QuizSession {
  id: string;
  userId: string;
  quizType: QuizType;
  difficulty: DifficultyLevel;
  startTime: string;
  endTime?: string;
  questions: QuizQuestion[];
  score: number;
  totalQuestions: number;
  completed: boolean;
}

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  userAnswer?: string;
  isCorrect?: boolean;
  timeSpent: number; // in seconds
  hintsUsed: number;
  explanation?: string;
}

export interface LearningProgress {
  userId: string;
  vocabularyMastered: number;
  grammarPatternsLearned: number;
  quizSessionsCompleted: number;
  averageAccuracy: number;
  streakDays: number;
  lastStudyDate: string;
  weakAreas: string[];
  strongAreas: string[];
  nextReviewDate: string;
}

export interface SpacedRepetitionItem {
  id: string;
  userId: string;
  wordId: number;
  interval: number; // days
  repetitions: number;
  easeFactor: number;
  nextReview: string;
  lastReview?: string;
  quality: number; // 0-5 rating
}

export type QuizType = 
  | 'vocabulary_korean_to_english'
  | 'vocabulary_english_to_korean'
  | 'grammar_pattern'
  | 'sentence_completion'
  | 'multiple_choice'
  | 'fill_in_blank'
  | 'listening_comprehension'
  | 'mixed';

export type QuestionType = 
  | 'multiple_choice'
  | 'fill_in_blank'
  | 'sentence_completion'
  | 'translation'
  | 'grammar_recognition'
  | 'listening';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export class MCPKoreanLearningSystem {
  private db: sqlite3.Database;
  private openai: OpenAI;

  constructor() {
    const dbPath = path.join(process.cwd(), 'korean_learning.db');
    this.db = new sqlite3.Database(dbPath);
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.initializeEnhancedTables();
  }

  private initializeEnhancedTables(): void {
    // User profiles table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id TEXT PRIMARY KEY,
        telegram_id INTEGER UNIQUE NOT NULL,
        name TEXT,
        level TEXT DEFAULT 'beginner',
        join_date TEXT NOT NULL,
        total_study_time INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 0,
        preferred_study_time TEXT,
        learning_goals TEXT DEFAULT '[]'
      )
    `);

    // Quiz sessions table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS quiz_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        quiz_type TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT,
        score INTEGER DEFAULT 0,
        total_questions INTEGER DEFAULT 0,
        completed INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES user_profiles (id)
      )
    `);

    // Quiz questions table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS quiz_questions (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        type TEXT NOT NULL,
        question TEXT NOT NULL,
        options TEXT,
        correct_answer TEXT NOT NULL,
        user_answer TEXT,
        is_correct INTEGER,
        time_spent INTEGER DEFAULT 0,
        hints_used INTEGER DEFAULT 0,
        explanation TEXT,
        FOREIGN KEY (session_id) REFERENCES quiz_sessions (id)
      )
    `);

    // Learning progress table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS learning_progress (
        user_id TEXT PRIMARY KEY,
        vocabulary_mastered INTEGER DEFAULT 0,
        grammar_patterns_learned INTEGER DEFAULT 0,
        quiz_sessions_completed INTEGER DEFAULT 0,
        average_accuracy REAL DEFAULT 0,
        streak_days INTEGER DEFAULT 0,
        last_study_date TEXT,
        weak_areas TEXT DEFAULT '[]',
        strong_areas TEXT DEFAULT '[]',
        next_review_date TEXT,
        FOREIGN KEY (user_id) REFERENCES user_profiles (id)
      )
    `);

    // Spaced repetition table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS spaced_repetition (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        word_id INTEGER NOT NULL,
        interval INTEGER DEFAULT 1,
        repetitions INTEGER DEFAULT 0,
        ease_factor REAL DEFAULT 2.5,
        next_review TEXT NOT NULL,
        last_review TEXT,
        quality INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES user_profiles (id),
        FOREIGN KEY (word_id) REFERENCES vocabulary (id)
      )
    `);

    // User vocabulary tracking
    this.db.run(`
      CREATE TABLE IF NOT EXISTS user_vocabulary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        word_id INTEGER NOT NULL,
        mastery_level INTEGER DEFAULT 0,
        times_correct INTEGER DEFAULT 0,
        times_incorrect INTEGER DEFAULT 0,
        last_practiced TEXT,
        FOREIGN KEY (user_id) REFERENCES user_profiles (id),
        FOREIGN KEY (word_id) REFERENCES vocabulary (id),
        UNIQUE(user_id, word_id)
      )
    `);

    console.log('🚀 MCP Korean Learning System tables initialized');
  }

  // User Profile Management
  async createUserProfile(telegramId: number, name?: string): Promise<UserProfile> {
    const userId = `user_${telegramId}`;
    const profile: UserProfile = {
      id: userId,
      telegramId,
      name,
      level: 'beginner',
      joinDate: new Date().toISOString(),
      totalStudyTime: 0,
      streak: 0,
      learningGoals: []
    };

    await new Promise<void>((resolve, reject) => {
      this.db.run(`
        INSERT OR REPLACE INTO user_profiles 
        (id, telegram_id, name, level, join_date, total_study_time, streak, learning_goals)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        profile.id,
        profile.telegramId,
        profile.name,
        profile.level,
        profile.joinDate,
        profile.totalStudyTime,
        profile.streak,
        JSON.stringify(profile.learningGoals)
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Initialize learning progress
    await this.initializeLearningProgress(userId);

    return profile;
  }

  async getUserProfile(telegramId: number): Promise<UserProfile | null> {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT * FROM user_profiles WHERE telegram_id = ?
      `, [telegramId], (err, row: any) => {
        if (err) reject(err);
        else if (row) {
          resolve({
            id: row.id,
            telegramId: row.telegram_id,
            name: row.name,
            level: row.level,
            joinDate: row.join_date,
            totalStudyTime: row.total_study_time,
            streak: row.streak,
            preferredStudyTime: row.preferred_study_time,
            learningGoals: JSON.parse(row.learning_goals || '[]')
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  // Quiz Generation with MCP
  async generateAdaptiveQuiz(
    userId: string, 
    quizType: QuizType, 
    difficulty: DifficultyLevel,
    questionCount: number = 10
  ): Promise<QuizSession> {
    const sessionId = `quiz_${Date.now()}_${userId}`;
    const userProfile = await this.getUserProfileByUserId(userId);
    const userProgress = await this.getLearningProgress(userId);
    
    // Get words based on user's weak areas and spaced repetition
    const wordsToReview = await this.getWordsForReview(userId, questionCount);
    const questions: QuizQuestion[] = [];

    for (let i = 0; i < questionCount; i++) {
      const question = await this.generateQuestion(
        quizType,
        difficulty,
        wordsToReview[i % wordsToReview.length],
        userProfile?.level || 'beginner'
      );
      questions.push(question);
    }

    const session: QuizSession = {
      id: sessionId,
      userId,
      quizType,
      difficulty,
      startTime: new Date().toISOString(),
      questions,
      score: 0,
      totalQuestions: questionCount,
      completed: false
    };

    // Save session to database
    await this.saveQuizSession(session);

    return session;
  }

  private async generateQuestion(
    quizType: QuizType,
    difficulty: DifficultyLevel,
    word: any,
    userLevel: string
  ): Promise<QuizQuestion> {
    const questionId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let prompt = '';
    let questionType: QuestionType = 'multiple_choice';

    switch (quizType) {
      case 'vocabulary_korean_to_english':
        prompt = `Create a Korean to English vocabulary question for the word "${word.korean}" (meaning: ${word.english}).
        Difficulty: ${difficulty}
        User Level: ${userLevel}
        
        Generate:
        1. A clear question asking for the English meaning
        2. 4 multiple choice options (A, B, C, D) with the correct answer and 3 plausible distractors
        3. A brief explanation
        
        Format as JSON:
        {
          "question": "What does [Korean word] mean?",
          "options": ["option1", "option2", "option3", "option4"],
          "correctAnswer": "correct_option",
          "explanation": "brief explanation"
        }`;
        questionType = 'multiple_choice';
        break;

      case 'vocabulary_english_to_korean':
        prompt = `Create an English to Korean vocabulary question for the word "${word.english}" (Korean: ${word.korean}).
        Difficulty: ${difficulty}
        User Level: ${userLevel}
        
        Generate:
        1. A clear question asking for the Korean word
        2. 4 multiple choice options in Korean (A, B, C, D) with the correct answer and 3 plausible distractors
        3. A brief explanation
        
        Format as JSON:
        {
          "question": "What is the Korean word for [English word]?",
          "options": ["한국어1", "한국어2", "한국어3", "한국어4"],
          "correctAnswer": "correct_korean",
          "explanation": "brief explanation"
        }`;
        questionType = 'multiple_choice';
        break;

      case 'sentence_completion':
        prompt = `Create a sentence completion question using the word "${word.korean}" (${word.english}).
        Difficulty: ${difficulty}
        User Level: ${userLevel}
        
        Generate:
        1. A Korean sentence with a blank where the word should go
        2. 4 multiple choice options to fill the blank
        3. A brief explanation
        
        Format as JSON:
        {
          "question": "Complete the sentence: [Korean sentence with blank]",
          "options": ["option1", "option2", "option3", "option4"],
          "correctAnswer": "correct_option",
          "explanation": "brief explanation"
        }`;
        questionType = 'sentence_completion';
        break;

      case 'fill_in_blank':
        prompt = `Create a fill-in-the-blank question using the word "${word.korean}" (${word.english}).
        Difficulty: ${difficulty}
        User Level: ${userLevel}
        
        Generate:
        1. A Korean sentence with a blank where the user needs to type the answer
        2. The correct answer
        3. A brief explanation
        
        Format as JSON:
        {
          "question": "Fill in the blank: [Korean sentence with blank]",
          "correctAnswer": "correct_answer",
          "explanation": "brief explanation"
        }`;
        questionType = 'fill_in_blank';
        break;
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert Korean language teacher. Create educational quiz questions that are appropriate for the specified difficulty level.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const response = JSON.parse(completion.choices[0]?.message?.content || '{}');
      
      return {
        id: questionId,
        type: questionType,
        question: response.question,
        options: response.options,
        correctAnswer: response.correctAnswer,
        timeSpent: 0,
        hintsUsed: 0,
        explanation: response.explanation
      };
    } catch (error) {
      console.error('Error generating question:', error);
      // Fallback question
      return {
        id: questionId,
        type: questionType,
        question: `What does ${word.korean} mean?`,
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: word.english,
        timeSpent: 0,
        hintsUsed: 0,
        explanation: `${word.korean} means ${word.english}`
      };
    }
  }

  // Spaced Repetition System
  async updateSpacedRepetition(
    userId: string,
    wordId: number,
    quality: number // 0-5 rating
  ): Promise<void> {
    const item = await this.getSpacedRepetitionItem(userId, wordId);
    
    if (!item) {
      // Create new item
      await this.createSpacedRepetitionItem(userId, wordId, quality);
      return;
    }

    // Update existing item using SM-2 algorithm
    const newInterval = this.calculateNextInterval(item, quality);
    const newEaseFactor = this.calculateEaseFactor(item.easeFactor, quality);
    const newRepetitions = quality >= 3 ? item.repetitions + 1 : 0;
    
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);

    await new Promise<void>((resolve, reject) => {
      this.db.run(`
        UPDATE spaced_repetition 
        SET interval = ?, repetitions = ?, ease_factor = ?, 
            next_review = ?, last_review = ?, quality = ?
        WHERE user_id = ? AND word_id = ?
      `, [
        newInterval,
        newRepetitions,
        newEaseFactor,
        nextReview.toISOString(),
        new Date().toISOString(),
        quality,
        userId,
        wordId
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  private calculateNextInterval(item: SpacedRepetitionItem, quality: number): number {
    if (quality < 3) {
      return 1; // Reset to 1 day
    }
    
    if (item.repetitions === 0) {
      return 1;
    } else if (item.repetitions === 1) {
      return 6;
    } else {
      return Math.round(item.interval * item.easeFactor);
    }
  }

  private calculateEaseFactor(currentEaseFactor: number, quality: number): number {
    const newEaseFactor = currentEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    return Math.max(1.3, newEaseFactor);
  }

  // Progress Tracking
  async updateLearningProgress(userId: string, quizSession: QuizSession): Promise<void> {
    const progress = await this.getLearningProgress(userId);
    const accuracy = quizSession.score / quizSession.totalQuestions;
    
    const updatedProgress: LearningProgress = {
      ...progress,
      quizSessionsCompleted: progress.quizSessionsCompleted + 1,
      averageAccuracy: (progress.averageAccuracy * progress.quizSessionsCompleted + accuracy) / (progress.quizSessionsCompleted + 1),
      lastStudyDate: new Date().toISOString(),
      streakDays: this.calculateStreak(progress.lastStudyDate)
    };

    await new Promise<void>((resolve, reject) => {
      this.db.run(`
        UPDATE learning_progress 
        SET quiz_sessions_completed = ?, average_accuracy = ?, 
            last_study_date = ?, streak_days = ?
        WHERE user_id = ?
      `, [
        updatedProgress.quizSessionsCompleted,
        updatedProgress.averageAccuracy,
        updatedProgress.lastStudyDate,
        updatedProgress.streakDays,
        userId
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Analytics and Insights
  public async generateLearningInsights(userId: string): Promise<any> {
    const progress = await this.getLearningProgress(userId);
    const recentSessions = await this.getRecentQuizSessions(userId, 10);
    const weakWords = await this.getWeakWords(userId);
    
    return {
      overallProgress: progress,
      recentPerformance: this.analyzeRecentPerformance(recentSessions),
      weakAreas: weakWords,
      recommendations: this.generateRecommendations(progress, weakWords),
      nextReviewDate: progress.nextReviewDate
    };
  }

  // Helper methods
  public async getUserProfileByUserId(userId: string): Promise<UserProfile | null> {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT * FROM user_profiles WHERE id = ?
      `, [userId], (err, row: any) => {
        if (err) reject(err);
        else if (row) {
          resolve({
            id: row.id,
            telegramId: row.telegram_id,
            name: row.name,
            level: row.level,
            joinDate: row.join_date,
            totalStudyTime: row.total_study_time,
            streak: row.streak,
            preferredStudyTime: row.preferred_study_time,
            learningGoals: JSON.parse(row.learning_goals || '[]')
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  private async initializeLearningProgress(userId: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.db.run(`
        INSERT INTO learning_progress 
        (user_id, vocabulary_mastered, grammar_patterns_learned, 
         quiz_sessions_completed, average_accuracy, streak_days, 
         last_study_date, weak_areas, strong_areas, next_review_date)
        VALUES (?, 0, 0, 0, 0, 0, ?, '[]', '[]', ?)
      `, [
        userId,
        new Date().toISOString(),
        new Date().toISOString()
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  public async getLearningProgress(userId: string): Promise<LearningProgress> {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT * FROM learning_progress WHERE user_id = ?
      `, [userId], (err, row: any) => {
        if (err) reject(err);
        else if (row) {
          resolve({
            userId: row.user_id,
            vocabularyMastered: row.vocabulary_mastered,
            grammarPatternsLearned: row.grammar_patterns_learned,
            quizSessionsCompleted: row.quiz_sessions_completed,
            averageAccuracy: row.average_accuracy,
            streakDays: row.streak_days,
            lastStudyDate: row.last_study_date,
            weakAreas: JSON.parse(row.weak_areas || '[]'),
            strongAreas: JSON.parse(row.strong_areas || '[]'),
            nextReviewDate: row.next_review_date
          });
        } else {
          // Return default progress
          resolve({
            userId,
            vocabularyMastered: 0,
            grammarPatternsLearned: 0,
            quizSessionsCompleted: 0,
            averageAccuracy: 0,
            streakDays: 0,
            lastStudyDate: new Date().toISOString(),
            weakAreas: [],
            strongAreas: [],
            nextReviewDate: new Date().toISOString()
          });
        }
      });
    });
  }

  private calculateStreak(lastStudyDate: string): number {
    const lastDate = new Date(lastStudyDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 1 ? 1 : 0; // Simple streak calculation
  }

  private async saveQuizSession(session: QuizSession): Promise<void> {
    // Save session
    await new Promise<void>((resolve, reject) => {
      this.db.run(`
        INSERT INTO quiz_sessions 
        (id, user_id, quiz_type, difficulty, start_time, end_time, 
         score, total_questions, completed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        session.id,
        session.userId,
        session.quizType,
        session.difficulty,
        session.startTime,
        session.endTime,
        session.score,
        session.totalQuestions,
        session.completed ? 1 : 0
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Save questions
    for (const question of session.questions) {
      await new Promise<void>((resolve, reject) => {
        this.db.run(`
          INSERT INTO quiz_questions 
          (id, session_id, type, question, options, correct_answer, 
           user_answer, is_correct, time_spent, hints_used, explanation)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          question.id,
          session.id,
          question.type,
          question.question,
          JSON.stringify(question.options),
          question.correctAnswer,
          question.userAnswer,
          question.isCorrect ? 1 : 0,
          question.timeSpent,
          question.hintsUsed,
          question.explanation
        ], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }

  private async getWordsForReview(userId: string, count: number): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT v.*, sr.next_review, sr.interval, sr.repetitions
        FROM vocabulary v
        LEFT JOIN spaced_repetition sr ON v.id = sr.word_id AND sr.user_id = ?
        WHERE sr.next_review <= ? OR sr.next_review IS NULL
        ORDER BY sr.next_review ASC, v.frequency DESC
        LIMIT ?
      `, [userId, new Date().toISOString(), count], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  private async getSpacedRepetitionItem(userId: string, wordId: number): Promise<SpacedRepetitionItem | null> {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT * FROM spaced_repetition 
        WHERE user_id = ? AND word_id = ?
      `, [userId, wordId], (err, row: any) => {
        if (err) reject(err);
        else if (row) {
          resolve({
            id: row.id,
            userId: row.user_id,
            wordId: row.word_id,
            interval: row.interval,
            repetitions: row.repetitions,
            easeFactor: row.ease_factor,
            nextReview: row.next_review,
            lastReview: row.last_review,
            quality: row.quality
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  private async createSpacedRepetitionItem(userId: string, wordId: number, quality: number): Promise<void> {
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + 1);

    await new Promise<void>((resolve, reject) => {
      this.db.run(`
        INSERT INTO spaced_repetition 
        (id, user_id, word_id, interval, repetitions, ease_factor, 
         next_review, last_review, quality)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        `sr_${Date.now()}_${userId}_${wordId}`,
        userId,
        wordId,
        1,
        quality >= 3 ? 1 : 0,
        2.5,
        nextReview.toISOString(),
        new Date().toISOString(),
        quality
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  private async getRecentQuizSessions(userId: string, limit: number): Promise<QuizSession[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM quiz_sessions 
        WHERE user_id = ? 
        ORDER BY start_time DESC 
        LIMIT ?
      `, [userId, limit], (err, rows: any[]) => {
        if (err) reject(err);
        else {
          const sessions = rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            quizType: row.quiz_type as QuizType,
            difficulty: row.difficulty as DifficultyLevel,
            startTime: row.start_time,
            endTime: row.end_time,
            score: row.score,
            totalQuestions: row.total_questions,
            completed: row.completed === 1,
            questions: []
          }));
          resolve(sessions);
        }
      });
    });
  }

  private async getWeakWords(userId: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT v.*, uv.times_correct, uv.times_incorrect
        FROM vocabulary v
        JOIN user_vocabulary uv ON v.id = uv.word_id
        WHERE uv.user_id = ? AND uv.times_incorrect > uv.times_correct
        ORDER BY uv.times_incorrect DESC
        LIMIT 10
      `, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  private analyzeRecentPerformance(sessions: QuizSession[]): any {
    if (sessions.length === 0) return { averageScore: 0, trend: 'stable' };
    
    const scores = sessions.map(s => s.score / s.totalQuestions);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    let trend = 'stable';
    if (sessions.length >= 2) {
      const recent = scores.slice(0, Math.floor(scores.length / 2));
      const older = scores.slice(Math.floor(scores.length / 2));
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
      
      if (recentAvg > olderAvg + 0.1) trend = 'improving';
      else if (recentAvg < olderAvg - 0.1) trend = 'declining';
    }
    
    return { averageScore, trend };
  }

  private generateRecommendations(progress: LearningProgress, weakWords: any[]): string[] {
    const recommendations: string[] = [];
    
    if (progress.averageAccuracy < 0.7) {
      recommendations.push('Focus on reviewing basic vocabulary before moving to advanced topics');
    }
    
    if (weakWords.length > 5) {
      recommendations.push('Spend extra time practicing words you frequently get wrong');
    }
    
    if (progress.streakDays < 3) {
      recommendations.push('Try to study daily to build a consistent learning habit');
    }
    
    if (progress.quizSessionsCompleted < 10) {
      recommendations.push('Complete more quiz sessions to get better insights into your progress');
    }
    
    return recommendations;
  }
}
