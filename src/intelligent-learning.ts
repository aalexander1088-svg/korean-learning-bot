import { KoreanDatabase, StoredVocabulary } from './database';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

interface LearningAnalytics {
  userId: string;
  totalSessions: number;
  averageSessionLength: number;
  vocabularyLearned: number;
  grammarPatternsLearned: number;
  commonMistakes: Array<{
    pattern: string;
    frequency: number;
    lastOccurrence: string;
  }>;
  strengths: string[];
  weaknesses: string[];
  optimalStudyTime: string;
  retentionRate: number;
}

interface AdaptiveExercise {
  type: 'vocabulary' | 'grammar' | 'conversation';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  content: any;
  personalizedHints: string[];
  expectedTime: number;
}

export class IntelligentLearningSystem {
  private database: KoreanDatabase;
  private openai: OpenAI;
  private analytics: LearningAnalytics;

  constructor() {
    this.database = new KoreanDatabase();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.analytics = {
      userId: 'user_001',
      totalSessions: 0,
      averageSessionLength: 0,
      vocabularyLearned: 0,
      grammarPatternsLearned: 0,
      commonMistakes: [],
      strengths: [],
      weaknesses: [],
      optimalStudyTime: 'morning',
      retentionRate: 0
    };
  }

  async analyzeLearningPatterns(): Promise<LearningAnalytics> {
    try {
      const vocabulary = await this.database.getAllVocabulary();
      const grammar = await this.database.getAllGrammar();
      
      // Calculate retention rate
      const totalWords = vocabulary.length;
      const reviewedWords = vocabulary.filter(word => word.reviewCount > 0).length;
      this.analytics.retentionRate = totalWords > 0 ? (reviewedWords / totalWords) * 100 : 0;
      
      // Identify common mistakes
      const mistakePatterns = await this.identifyCommonMistakes(vocabulary);
      this.analytics.commonMistakes = mistakePatterns;
      
      // Determine strengths and weaknesses
      this.analytics.strengths = await this.identifyStrengths(vocabulary);
      this.analytics.weaknesses = await this.identifyWeaknesses(vocabulary);
      
      // Update analytics
      this.analytics.vocabularyLearned = totalWords;
      this.analytics.grammarPatternsLearned = grammar.length;
      
      return this.analytics;
    } catch (error) {
      console.error('Error analyzing learning patterns:', error);
      return this.analytics;
    }
  }

  private async identifyCommonMistakes(vocabulary: StoredVocabulary[]): Promise<Array<{
    pattern: string;
    frequency: number;
    lastOccurrence: string;
  }>> {
    // Analyze vocabulary patterns to identify common mistakes
    const mistakePatterns = [];
    
    // Look for words with low review counts (potential problem areas)
    const problemWords = vocabulary
      .filter(word => word.reviewCount < 2)
      .sort((a, b) => a.reviewCount - b.reviewCount)
      .slice(0, 5);
    
    for (const word of problemWords) {
      mistakePatterns.push({
        pattern: `Difficulty with: ${word.korean}`,
        frequency: 3 - word.reviewCount,
        lastOccurrence: word.dateAdded
      });
    }
    
    return mistakePatterns;
  }

  private async identifyStrengths(vocabulary: StoredVocabulary[]): Promise<string[]> {
    const strengths = [];
    
    // Words with high review counts
    const wellReviewedWords = vocabulary
      .filter(word => word.reviewCount >= 3)
      .slice(0, 3);
    
    if (wellReviewedWords.length > 0) {
      strengths.push(`Strong vocabulary retention (${wellReviewedWords.length} words mastered)`);
    }
    
    // Recent learning progress
    const recentWords = vocabulary.filter(word => {
      const wordDate = new Date(word.dateAdded);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return wordDate > weekAgo;
    });
    
    if (recentWords.length > 5) {
      strengths.push('Consistent daily learning');
    }
    
    return strengths;
  }

  private async identifyWeaknesses(vocabulary: StoredVocabulary[]): Promise<string[]> {
    const weaknesses = [];
    
    // Words that haven't been reviewed
    const unreviewedWords = vocabulary.filter(word => word.reviewCount === 0);
    if (unreviewedWords.length > 10) {
      weaknesses.push('Many words need review');
    }
    
    // Difficulty patterns
    const hardWords = vocabulary.filter(word => word.difficulty === 'Hard');
    if (hardWords.length > 5) {
      weaknesses.push('Challenging vocabulary needs more practice');
    }
    
    return weaknesses;
  }

  async generateAdaptiveExercises(): Promise<AdaptiveExercise[]> {
    const analytics = await this.analyzeLearningPatterns();
    const exercises: AdaptiveExercise[] = [];
    
    // Generate vocabulary exercises based on weaknesses
    if (analytics.weaknesses.includes('Many words need review')) {
      const reviewWords = await this.database.getWordsForSpacedRepetition(7);
      exercises.push({
        type: 'vocabulary',
        difficulty: 'Medium',
        content: {
          words: reviewWords.slice(0, 5),
          exerciseType: 'spaced_repetition'
        },
        personalizedHints: [
          'Focus on words you learned recently',
          'Try to use these words in sentences'
        ],
        expectedTime: 10
      });
    }
    
    // Generate grammar exercises for common mistakes
    if (analytics.commonMistakes.length > 0) {
      exercises.push({
        type: 'grammar',
        difficulty: 'Hard',
        content: {
          focusArea: analytics.commonMistakes[0].pattern,
          exercises: ['sentence_completion', 'translation']
        },
        personalizedHints: [
          'Pay attention to particle usage',
          'Practice with similar sentence structures'
        ],
        expectedTime: 15
      });
    }
    
    // Generate conversation exercises
    exercises.push({
      type: 'conversation',
      difficulty: analytics.retentionRate > 70 ? 'Hard' : 'Medium',
      content: {
        topic: 'daily_life',
        vocabularyToUse: await this.getRecommendedVocabulary()
      },
      personalizedHints: [
        'Try to use recently learned words',
        'Focus on natural pronunciation'
      ],
      expectedTime: 20
    });
    
    return exercises;
  }

  private async getRecommendedVocabulary(): Promise<StoredVocabulary[]> {
    // Get words that need more practice
    const wordsForReview = await this.database.getWordsForSpacedRepetition(7);
    const essentialWords = await this.database.getEssentialWords();
    
    return [...wordsForReview.slice(0, 3), ...essentialWords.slice(0, 2)];
  }

  async generatePersonalizedStudyPlan(): Promise<{
    dailyGoal: string;
    weeklyGoal: string;
    focusAreas: string[];
    recommendedSchedule: Array<{
      time: string;
      activity: string;
      duration: number;
    }>;
  }> {
    const analytics = await this.analyzeLearningPatterns();
    
    const dailyGoal = analytics.retentionRate > 80 
      ? 'Learn 5 new words and practice conversation'
      : 'Review 10 words and learn 3 new ones';
    
    const weeklyGoal = analytics.vocabularyLearned > 50
      ? 'Master 20 new vocabulary words and 2 grammar patterns'
      : 'Build foundation with 15 essential words';
    
    const focusAreas = analytics.weaknesses.length > 0 
      ? analytics.weaknesses 
      : ['Continue building vocabulary', 'Practice conversation'];
    
    const recommendedSchedule = [
      {
        time: 'Morning (7-8 AM)',
        activity: 'Vocabulary review',
        duration: 15
      },
      {
        time: 'Afternoon (2-3 PM)',
        activity: 'Grammar practice',
        duration: 20
      },
      {
        time: 'Evening (7-8 PM)',
        activity: 'Conversation practice',
        duration: 25
      }
    ];
    
    return {
      dailyGoal,
      weeklyGoal,
      focusAreas,
      recommendedSchedule
    };
  }

  async generateProgressReport(): Promise<string> {
    const analytics = await this.analyzeLearningPatterns();
    const studyPlan = await this.generatePersonalizedStudyPlan();
    
    const report = `
📊 Korean Learning Progress Report
================================

📈 Current Stats:
• Total vocabulary learned: ${analytics.vocabularyLearned} words
• Grammar patterns mastered: ${analytics.grammarPatternsLearned}
• Retention rate: ${analytics.retentionRate.toFixed(1)}%
• Study sessions completed: ${analytics.totalSessions}

💪 Strengths:
${analytics.strengths.map(strength => `• ${strength}`).join('\n')}

🎯 Areas to Focus On:
${analytics.weaknesses.map(weakness => `• ${weakness}`).join('\n')}

📅 Recommended Daily Schedule:
${studyPlan.recommendedSchedule.map(item => 
  `• ${item.time}: ${item.activity} (${item.duration} min)`
).join('\n')}

🎯 This Week's Goal:
${studyPlan.weeklyGoal}

💡 Daily Goal:
${studyPlan.dailyGoal}

화이팅! Keep up the great work! 💪
`;

    return report;
  }

  close(): void {
    this.database.close();
  }
}

// Export for use in other modules
export { LearningAnalytics, AdaptiveExercise };
