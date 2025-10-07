#!/usr/bin/env node

import * as sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import * as dotenv from 'dotenv';

dotenv.config();

async function addSampleKoreanWords() {
  const db = await open({
    filename: process.env.DATABASE_PATH || 'korean_learning.db',
    driver: sqlite3.Database
  });

  // Sample Korean vocabulary
  const sampleWords = [
    { korean: '안녕하세요', english: 'Hello', pronunciation: 'annyeonghaseyo', difficulty: 'beginner' },
    { korean: '감사합니다', english: 'Thank you', pronunciation: 'gamsahamnida', difficulty: 'beginner' },
    { korean: '죄송합니다', english: 'Sorry', pronunciation: 'joesonghamnida', difficulty: 'beginner' },
    { korean: '네', english: 'Yes', pronunciation: 'ne', difficulty: 'beginner' },
    { korean: '아니요', english: 'No', pronunciation: 'aniyo', difficulty: 'beginner' },
    { korean: '물', english: 'Water', pronunciation: 'mul', difficulty: 'beginner' },
    { korean: '밥', english: 'Rice/Food', pronunciation: 'bap', difficulty: 'beginner' },
    { korean: '집', english: 'House', pronunciation: 'jip', difficulty: 'beginner' },
    { korean: '학교', english: 'School', pronunciation: 'hakgyo', difficulty: 'beginner' },
    { korean: '친구', english: 'Friend', pronunciation: 'chingu', difficulty: 'beginner' },
    { korean: '가족', english: 'Family', pronunciation: 'gajok', difficulty: 'intermediate' },
    { korean: '사랑', english: 'Love', pronunciation: 'sarang', difficulty: 'intermediate' },
    { korean: '꿈', english: 'Dream', pronunciation: 'kkum', difficulty: 'intermediate' },
    { korean: '희망', english: 'Hope', pronunciation: 'huimang', difficulty: 'intermediate' },
    { korean: '노력', english: 'Effort', pronunciation: 'noryeok', difficulty: 'intermediate' },
    { korean: '성공', english: 'Success', pronunciation: 'seonggong', difficulty: 'intermediate' },
    { korean: '실패', english: 'Failure', pronunciation: 'silpae', difficulty: 'intermediate' },
    { korean: '도전', english: 'Challenge', pronunciation: 'dojeon', difficulty: 'intermediate' },
    { korean: '기회', english: 'Opportunity', pronunciation: 'gihoe', difficulty: 'intermediate' },
    { korean: '경험', english: 'Experience', pronunciation: 'gyeongheom', difficulty: 'intermediate' }
  ];

  console.log('📚 Adding sample Korean vocabulary...');

  for (const word of sampleWords) {
    try {
      await db.run(`
        INSERT OR IGNORE INTO vocabulary (korean, english, difficulty)
        VALUES (?, ?, ?)
      `, [word.korean, word.english, word.difficulty]);
      
      console.log(`✅ Added: ${word.korean} - ${word.english}`);
    } catch (error) {
      console.error(`❌ Failed to add ${word.korean}:`, error);
    }
  }

  // Check how many words we have
  const count = await db.get('SELECT COUNT(*) as count FROM vocabulary');
  console.log(`\n📊 Total Korean words in database: ${count.count}`);

  await db.close();
  console.log('\n🎉 Sample vocabulary added successfully!');
}

addSampleKoreanWords().catch(console.error);
