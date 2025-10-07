import * as sqlite3 from 'sqlite3';
import * as path from 'path';

async function migrateDatabase() {
  const dbPath = path.join(process.cwd(), 'korean_learning.db');
  const db = new sqlite3.Database(dbPath);

  console.log('🔄 Migrating database schema...');

  try {
    // Add new columns to vocabulary table
    await new Promise<void>((resolve, reject) => {
      db.run(`
        ALTER TABLE vocabulary 
        ADD COLUMN frequency INTEGER DEFAULT 1
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    await new Promise<void>((resolve, reject) => {
      db.run(`
        ALTER TABLE vocabulary 
        ADD COLUMN difficulty TEXT DEFAULT 'Medium'
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    await new Promise<void>((resolve, reject) => {
      db.run(`
        ALTER TABLE vocabulary 
        ADD COLUMN isEssential INTEGER DEFAULT 0
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    console.log('✅ Database migration completed successfully!');
    
    // Mark some common words as essential
    const commonWords = ['예전에는', '전혀', '현재', '드디어', '방법', '대부분', '이유', '왜냐면', '시간 낭비', '신기하다'];
    
    for (const word of commonWords) {
      await new Promise<void>((resolve, reject) => {
        db.run(
          'UPDATE vocabulary SET isEssential = 1 WHERE korean = ?',
          [word],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
    
    console.log(`✅ Marked ${commonWords.length} common words as essential`);

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    db.close();
  }
}

// Run migration
migrateDatabase();






