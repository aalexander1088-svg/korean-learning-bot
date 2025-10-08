#!/usr/bin/env node

import * as sqlite3 from 'sqlite3';
import * as path from 'path';

async function showVocabulary() {
  const dbPath = path.join(process.cwd(), 'korean_learning.db');
  const db = new sqlite3.Database(dbPath);

  console.log('📚 Your Korean Vocabulary Database:');
  console.log('=====================================');

  // Get recent vocabulary
  db.all(`
    SELECT korean, english, dateAdded, difficulty, isEssential 
    FROM vocabulary 
    ORDER BY dateAdded DESC 
    LIMIT 15
  `, (err, rows: any[]) => {
    if (err) {
      console.error('Error:', err);
      return;
    }

    if (rows.length === 0) {
      console.log('No vocabulary found in database.');
      return;
    }

    console.log(`\n📖 Recent Words (${rows.length} total):`);
    console.log('----------------------------------------');
    
    rows.forEach((row, index) => {
      const essential = row.isEssential ? '⭐' : '';
      const difficulty = row.difficulty || 'Medium';
      const date = new Date(row.dateAdded).toLocaleDateString();
      
      console.log(`${index + 1}. ${row.korean} = ${row.english} ${essential}`);
      console.log(`   Difficulty: ${difficulty} | Added: ${date}`);
      console.log('');
    });

    // Get essential words
    db.all(`
      SELECT korean, english, dateAdded 
      FROM vocabulary 
      WHERE isEssential = 1 
      ORDER BY dateAdded DESC 
      LIMIT 10
    `, (err, essentialRows: any[]) => {
      if (err) {
        console.error('Error:', err);
        return;
      }

      if (essentialRows.length > 0) {
        console.log('⭐ Essential Words:');
        console.log('------------------');
        
        essentialRows.forEach((row, index) => {
          const date = new Date(row.dateAdded).toLocaleDateString();
          console.log(`${index + 1}. ${row.korean} = ${row.english} (${date})`);
        });
      }

      // Get total count
      db.get(`
        SELECT COUNT(*) as total FROM vocabulary
      `, (err, countRow: any) => {
        if (err) {
          console.error('Error:', err);
          return;
        }

        console.log(`\n📊 Total vocabulary words: ${countRow.total}`);
        
        db.close();
      });
    });
  });
}

showVocabulary().catch(console.error);