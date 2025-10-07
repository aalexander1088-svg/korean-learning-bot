import { KoreanDatabase } from './database';
import * as dotenv from 'dotenv';

dotenv.config();

class VocabularyImporter {
  private database: KoreanDatabase;

  constructor() {
    this.database = new KoreanDatabase();
  }

  async importVocabulary(vocabularyText: string): Promise<void> {
    console.log('📚 Starting vocabulary import...');
    
    // Split by lines and process each line
    const lines = vocabularyText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let importedCount = 0;
    let skippedCount = 0;

    for (const line of lines) {
      try {
        // Try different formats
        let korean = '';
        let english = '';

        // Format 1: "Korean - English"
        if (line.includes(' - ')) {
          const parts = line.split(' - ');
          korean = parts[0].trim();
          english = parts[1].trim();
        }
        // Format 2: "Korean: English"
        else if (line.includes(': ')) {
          const parts = line.split(': ');
          korean = parts[0].trim();
          english = parts[1].trim();
        }
        // Format 3: "Korean English" (space separated)
        else if (line.includes(' ')) {
          const parts = line.split(' ');
          korean = parts[0].trim();
          english = parts.slice(1).join(' ').trim();
        }
        // Format 4: Just Korean word (skip if no English)
        else {
          console.log(`⚠️ Skipping line (no English found): ${line}`);
          skippedCount++;
          continue;
        }

        // Validate that we have both Korean and English
        if (korean && english && korean.length > 0 && english.length > 0) {
          // Check if already exists
          const existing = await this.database.getAllVocabulary();
          const alreadyExists = existing.some(word => 
            word.korean === korean && word.english === english
          );

          if (!alreadyExists) {
            await this.database.storeVocabulary([{
              korean: korean,
              english: english
            }]);
            console.log(`✅ Added: ${korean} - ${english}`);
            importedCount++;
          } else {
            console.log(`⏭️ Already exists: ${korean} - ${english}`);
            skippedCount++;
          }
        } else {
          console.log(`⚠️ Skipping line (invalid format): ${line}`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing line "${line}":`, error);
        skippedCount++;
      }
    }

    console.log(`\n📊 Import Summary:`);
    console.log(`✅ Imported: ${importedCount} words`);
    console.log(`⏭️ Skipped: ${skippedCount} words`);
    console.log(`📚 Total in database: ${(await this.database.getAllVocabulary()).length} words`);
  }

  async close(): Promise<void> {
    await this.database.close();
  }
}

// Main execution
async function main() {
  const importer = new VocabularyImporter();
  
  console.log('📚 Korean Vocabulary Importer');
  console.log('Paste your vocabulary below (press Ctrl+C when done):\n');
  
  // Read from stdin
  let input = '';
  process.stdin.setEncoding('utf8');
  
  process.stdin.on('data', (chunk) => {
    input += chunk;
  });
  
  process.stdin.on('end', async () => {
    try {
      await importer.importVocabulary(input);
      await importer.close();
      process.exit(0);
    } catch (error) {
      console.error('❌ Import failed:', error);
      process.exit(1);
    }
  });
  
  // Handle Ctrl+C
  process.on('SIGINT', async () => {
    console.log('\n\n📚 Processing vocabulary...');
    try {
      await importer.importVocabulary(input);
      await importer.close();
      process.exit(0);
    } catch (error) {
      console.error('❌ Import failed:', error);
      process.exit(1);
    }
  });
}

if (require.main === module) {
  main();
}

export { VocabularyImporter };
