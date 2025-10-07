import { KoreanLearningEmailScript } from './index';
import { KoreanConversationalAI } from './ai-practice';
import { IntelligentLearningSystem } from './intelligent-learning';
import { InteractiveLearningFeatures } from './interactive-features';
import { KoreanChatCompanion } from './chat-server';
import * as dotenv from 'dotenv';

dotenv.config();

class KoreanAIDemo {
  private emailScript: KoreanLearningEmailScript;
  private conversationalAI: KoreanConversationalAI;
  private learningSystem: IntelligentLearningSystem;
  private interactiveFeatures: InteractiveLearningFeatures;

  constructor() {
    this.emailScript = new KoreanLearningEmailScript();
    this.conversationalAI = new KoreanConversationalAI();
    this.learningSystem = new IntelligentLearningSystem();
    this.interactiveFeatures = new InteractiveLearningFeatures();
  }

  async runDemo(): Promise<void> {
    console.log('🚀 Korean Learning AI System Demo');
    console.log('==================================');
    console.log('');

    // Demo 1: Intelligent Learning Analytics
    console.log('📊 1. Learning Analytics Demo');
    console.log('-----------------------------');
    try {
      const analytics = await this.learningSystem.analyzeLearningPatterns();
      console.log(`✅ Vocabulary learned: ${analytics.vocabularyLearned} words`);
      console.log(`✅ Retention rate: ${analytics.retentionRate.toFixed(1)}%`);
      console.log(`✅ Strengths: ${analytics.strengths.join(', ')}`);
      console.log(`✅ Areas to focus: ${analytics.weaknesses.join(', ')}`);
    } catch (error) {
      console.log('❌ Analytics demo failed:', error);
    }
    console.log('');

    // Demo 2: Adaptive Exercise Generation
    console.log('🎯 2. Adaptive Exercise Generation');
    console.log('----------------------------------');
    try {
      const exercises = await this.learningSystem.generateAdaptiveExercises();
      console.log(`✅ Generated ${exercises.length} adaptive exercises`);
      exercises.forEach((exercise, index) => {
        console.log(`   ${index + 1}. ${exercise.type} (${exercise.difficulty}) - ${exercise.expectedTime} min`);
      });
    } catch (error) {
      console.log('❌ Exercise generation failed:', error);
    }
    console.log('');

    // Demo 3: Personalized Study Plan
    console.log('📅 3. Personalized Study Plan');
    console.log('------------------------------');
    try {
      const studyPlan = await this.learningSystem.generatePersonalizedStudyPlan();
      console.log(`✅ Daily goal: ${studyPlan.dailyGoal}`);
      console.log(`✅ Weekly goal: ${studyPlan.weeklyGoal}`);
      console.log(`✅ Focus areas: ${studyPlan.focusAreas.join(', ')}`);
      console.log(`✅ Recommended schedule:`);
      studyPlan.recommendedSchedule.forEach(item => {
        console.log(`   • ${item.time}: ${item.activity} (${item.duration} min)`);
      });
    } catch (error) {
      console.log('❌ Study plan generation failed:', error);
    }
    console.log('');

    // Demo 4: Progress Report
    console.log('📈 4. Progress Report Generation');
    console.log('--------------------------------');
    try {
      const progressReport = await this.learningSystem.generateProgressReport();
      console.log('✅ Progress report generated successfully');
      console.log('📄 Report preview:');
      console.log(progressReport.split('\n').slice(0, 10).join('\n'));
      console.log('... (truncated)');
    } catch (error) {
      console.log('❌ Progress report generation failed:', error);
    }
    console.log('');

    // Demo 5: Smart Notifications
    console.log('🔔 5. Smart Notifications Demo');
    console.log('------------------------------');
    try {
      await this.interactiveFeatures.createCustomNotification(
        'achievement',
        'You\'ve learned 50 Korean words! 🎉',
        new Date(Date.now() + 60000) // 1 minute from now
      );
      console.log('✅ Custom notification scheduled');
      
      const streak = await this.interactiveFeatures.getLearningStreak();
      console.log(`✅ Current learning streak: ${streak} days`);
    } catch (error) {
      console.log('❌ Notifications demo failed:', error);
    }
    console.log('');

    // Demo 6: AI Chat Companion
    console.log('🗣️ 6. AI Chat Companion Demo');
    console.log('-----------------------------');
    try {
      console.log('✅ Chat server can be started with: npm run chat');
      console.log('✅ Web interface available at: http://localhost:3000');
      console.log('✅ Features: Real-time chat, Korean analysis, corrections');
    } catch (error) {
      console.log('❌ Chat companion demo failed:', error);
    }
    console.log('');

    // Demo 7: Conversational AI Practice
    console.log('💬 7. Conversational AI Practice Demo');
    console.log('------------------------------------');
    try {
      console.log('✅ Interactive practice available with: npm run ai-practice');
      console.log('✅ Features: Topic selection, difficulty levels, real-time feedback');
      console.log('✅ Korean input analysis and corrections');
    } catch (error) {
      console.log('❌ Conversational AI demo failed:', error);
    }
    console.log('');

    // Demo 8: Email System
    console.log('📧 8. Email System Demo');
    console.log('----------------------');
    try {
      console.log('✅ Daily emails scheduled for 5 AM');
      console.log('✅ Test email available with: npm run schedule -- --test');
      console.log('✅ Features: PDF analysis, AI content generation, HTML formatting');
    } catch (error) {
      console.log('❌ Email system demo failed:', error);
    }
    console.log('');

    console.log('🎉 Demo Complete!');
    console.log('================');
    console.log('');
    console.log('🚀 Available Commands:');
    console.log('• npm run schedule -- --test  (Test daily email)');
    console.log('• npm run ai-practice         (Interactive conversation)');
    console.log('• npm run chat                (Web chat server)');
    console.log('• npm run review              (Review vocabulary)');
    console.log('• npm run show-vocab          (View all words)');
    console.log('');
    console.log('💡 Pro Tips:');
    console.log('• Use the web chat for visual feedback');
    console.log('• Practice daily for best results');
    console.log('• Check your email for daily lessons');
    console.log('• Review mistakes regularly');
    console.log('');
    console.log('화이팅! Keep learning Korean! 🇰🇷');
  }

  close(): void {
    this.learningSystem.close();
    this.interactiveFeatures.close();
  }
}

// Run the demo
const demo = new KoreanAIDemo();
demo.runDemo().then(() => {
  demo.close();
  process.exit(0);
}).catch(error => {
  console.error('Demo failed:', error);
  demo.close();
  process.exit(1);
});
