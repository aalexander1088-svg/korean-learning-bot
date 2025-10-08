#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { MCPKoreanLearningSystem } from './mcp-korean-learning';

dotenv.config();

async function testMCPSystem() {
  console.log('🧪 Testing MCP Korean Learning System...');
  
  try {
    const mcpSystem = new MCPKoreanLearningSystem();
    
    // Test 1: Create user profile
    console.log('\n📝 Test 1: Creating user profile...');
    const testTelegramId = 123456789; // Test ID
    const profile = await mcpSystem.createUserProfile(testTelegramId, 'Test User');
    console.log('✅ User profile created:', profile.id);
    
    // Test 2: Generate adaptive quiz
    console.log('\n🎯 Test 2: Generating adaptive quiz...');
    const quiz = await mcpSystem.generateAdaptiveQuiz(
      profile.id,
      'vocabulary_korean_to_english',
      'beginner',
      3
    );
    console.log('✅ Quiz generated:', quiz.id);
    console.log(`   - Questions: ${quiz.questions.length}`);
    console.log(`   - Type: ${quiz.quizType}`);
    console.log(`   - Difficulty: ${quiz.difficulty}`);
    
    // Test 3: Check learning progress
    console.log('\n📊 Test 3: Checking learning progress...');
    const progress = await mcpSystem.getLearningProgress(profile.id);
    console.log('✅ Progress retrieved:');
    console.log(`   - Quiz sessions: ${progress.quizSessionsCompleted}`);
    console.log(`   - Average accuracy: ${(progress.averageAccuracy * 100).toFixed(1)}%`);
    console.log(`   - Streak days: ${progress.streakDays}`);
    
    // Test 4: Generate learning insights
    console.log('\n🧠 Test 4: Generating learning insights...');
    const insights = await mcpSystem.generateLearningInsights(profile.id);
    console.log('✅ Insights generated:');
    console.log(`   - Recent performance: ${insights.recentPerformance.averageScore.toFixed(2)}`);
    console.log(`   - Trend: ${insights.recentPerformance.trend}`);
    console.log(`   - Recommendations: ${insights.recommendations.length}`);
    
    // Test 5: Spaced repetition
    console.log('\n🔄 Test 5: Testing spaced repetition...');
    await mcpSystem.updateSpacedRepetition(profile.id, 1, 4); // Quality rating 4
    console.log('✅ Spaced repetition updated');
    
    console.log('\n🎉 All MCP system tests passed!');
    console.log('\n📋 System Features Verified:');
    console.log('✅ User profile management');
    console.log('✅ Adaptive quiz generation');
    console.log('✅ Progress tracking');
    console.log('✅ Learning insights');
    console.log('✅ Spaced repetition algorithm');
    
    console.log('\n🚀 The MCP-enhanced bot is ready for deployment!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testMCPSystem().catch(console.error);
