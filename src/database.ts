import * as sqlite3 from 'sqlite3';
import * as path from 'path';

export interface StoredVocabulary {
  id?: number;
  korean: string;
  english: string;
  dateAdded: string;
  reviewCount: number;
  lastReviewed?: string;
  frequency: number; // How often this word appears in PDFs
  difficulty: 'Easy' | 'Medium' | 'Hard';
  isEssential: boolean; // Marked as essential/useful word
}

export interface StoredGrammar {
  id?: number;
  pattern: string;
  explanation: string;
  examples: string | string[];
  dateAdded: string;
  reviewCount: number;
  lastReviewed?: string;
}

export class KoreanDatabase {
  private db: sqlite3.Database;

  constructor() {
    const dbPath = path.join(process.cwd(), 'korean_learning.db');
    this.db = new sqlite3.Database(dbPath);
    this.initializeTables();
  }

  private initializeTables(): void {
    // Vocabulary table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS vocabulary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        korean TEXT NOT NULL,
        english TEXT NOT NULL,
        dateAdded TEXT NOT NULL,
        reviewCount INTEGER DEFAULT 0,
        lastReviewed TEXT,
        frequency INTEGER DEFAULT 1,
        difficulty TEXT DEFAULT 'Medium',
        isEssential INTEGER DEFAULT 0
      )
    `);

    // Grammar table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS grammar (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pattern TEXT NOT NULL,
        explanation TEXT NOT NULL,
        examples TEXT NOT NULL,
        dateAdded TEXT NOT NULL,
        reviewCount INTEGER DEFAULT 0,
        lastReviewed TEXT
      )
    `);

    console.log('📊 Database tables initialized');
  }

  async storeVocabulary(vocabulary: Array<{korean: string; english: string}>): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO vocabulary (korean, english, dateAdded, frequency, difficulty, isEssential)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const today = new Date().toISOString().split('T')[0];
    
    vocabulary.forEach(item => {
      stmt.run(
        item.korean,
        item.english,
        today,
        1, // frequency
        'Medium', // difficulty
        0 // isEssential
      );
    });
    
    stmt.finalize();
    console.log(`📚 Stored ${vocabulary.length} vocabulary words`);
  }

  async storeGrammar(grammar: Array<{pattern: string; explanation: string; examples: string[]}>): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO grammar (pattern, explanation, examples, dateAdded)
      VALUES (?, ?, ?, ?)
    `);

    const today = new Date().toISOString().split('T')[0];
    
    grammar.forEach(item => {
      stmt.run(
        item.pattern,
        item.explanation,
        JSON.stringify(item.examples),
        today
      );
    });
    
    stmt.finalize();
    console.log(`📖 Stored ${grammar.length} grammar patterns`);
  }

  async getAllVocabulary(): Promise<StoredVocabulary[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM vocabulary ORDER BY dateAdded DESC',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as StoredVocabulary[]);
        }
      );
    });
  }

  async getAllGrammar(): Promise<StoredGrammar[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM grammar ORDER BY dateAdded DESC',
        (err, rows) => {
          if (err) reject(err);
          else {
            const grammar = rows as StoredGrammar[];
            // Parse examples JSON
            grammar.forEach(item => {
              try {
                item.examples = JSON.parse(item.examples as any) as string[];
              } catch (e) {
                item.examples = [];
              }
            });
            resolve(grammar);
          }
        }
      );
    });
  }

  async getVocabulary(limit: number = 50): Promise<StoredVocabulary[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM vocabulary ORDER BY dateAdded DESC LIMIT ?',
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as StoredVocabulary[]);
        }
      );
    });
  }

  async getGrammar(limit: number = 20): Promise<StoredGrammar[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM grammar ORDER BY dateAdded DESC LIMIT ?',
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else {
            const grammar = rows as StoredGrammar[];
            // Parse examples JSON
            grammar.forEach(item => {
              try {
                item.examples = JSON.parse(item.examples as any) as string[];
              } catch (e) {
                item.examples = [];
              }
            });
            resolve(grammar);
          }
        }
      );
    });
  }

  async updateReviewCount(table: 'vocabulary' | 'grammar', id: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    this.db.run(
      `UPDATE ${table} SET reviewCount = reviewCount + 1, lastReviewed = ? WHERE id = ?`,
      [today, id]
    );
  }

  async getWordsForSpacedRepetition(days: number = 7): Promise<StoredVocabulary[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffString = cutoffDate.toISOString().split('T')[0];

    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM vocabulary 
         WHERE dateAdded >= ? AND (lastReviewed IS NULL OR lastReviewed < ?)
         ORDER BY isEssential DESC, frequency DESC, reviewCount ASC
         LIMIT 10`,
        [cutoffString, cutoffString],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as StoredVocabulary[]);
        }
      );
    });
  }

  async getEssentialWords(): Promise<StoredVocabulary[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM vocabulary 
         WHERE isEssential = 1 
         ORDER BY frequency DESC, reviewCount ASC
         LIMIT 5`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as StoredVocabulary[]);
        }
      );
    });
  }

  async markWordAsEssential(korean: string): Promise<void> {
    this.db.run(
      'UPDATE vocabulary SET isEssential = 1 WHERE korean = ?',
      [korean]
    );
  }

  async incrementWordFrequency(korean: string): Promise<void> {
    this.db.run(
      'UPDATE vocabulary SET frequency = frequency + 1 WHERE korean = ?',
      [korean]
    );
  }

  close(): void {
    this.db.close();
  }
}