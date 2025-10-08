#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';
import { PDFUploader } from './pdf-uploader';
import { KoreanDatabase } from './database';
import OpenAI from 'openai';

class SmartPDFWatcher {
  private watchPath: string;
  private pdfUploader: PDFUploader;
  private koreanDb: KoreanDatabase;
  private openai: OpenAI;
  private processedFiles: Set<string> = new Set();

  constructor(desktopPath?: string) {
    // Default to Desktop/Korean PDFs folder, or use provided path
    this.watchPath = desktopPath || path.join(require('os').homedir(), 'Desktop', 'Korean PDFs');
    this.pdfUploader = new PDFUploader();
    this.koreanDb = new KoreanDatabase();
    
    // Initialize OpenAI
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    console.log(`📁 Watching folder: ${this.watchPath}`);
  }

  public async startWatching(): Promise<void> {
    try {
      // Create the folder if it doesn't exist
      if (!fs.existsSync(this.watchPath)) {
        fs.mkdirSync(this.watchPath, { recursive: true });
        console.log(`📁 Created folder: ${this.watchPath}`);
      }

      // Process any existing PDFs first
      await this.processExistingPDFs();

      // Watch for new files
      const watcher = chokidar.watch(`${this.watchPath}/**/*.pdf`, {
        ignored: /^\./, // ignore dotfiles
        persistent: true,
        ignoreInitial: true // Don't process files on startup
      });

      watcher
        .on('add', (filePath) => this.handleNewPDF(filePath))
        .on('error', (error) => console.error('❌ Watcher error:', error));

      console.log('👀 Smart PDF watcher started! Drop PDFs into the folder to extract Korean words.');
      console.log(`📂 Watching: ${this.watchPath}`);
      console.log('🤖 AI translation enabled for Korean words');
      console.log('🔄 Press Ctrl+C to stop watching...');

      // Keep the process running
      process.on('SIGINT', () => {
        console.log('\n🛑 Stopping PDF watcher...');
        watcher.close();
        process.exit(0);
      });

    } catch (error) {
      console.error('❌ Error starting PDF watcher:', error);
    }
  }

  private async processExistingPDFs(): Promise<void> {
    try {
      const files = fs.readdirSync(this.watchPath);
      const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
      
      if (pdfFiles.length > 0) {
        console.log(`📚 Found ${pdfFiles.length} existing PDF(s):`);
        for (const file of pdfFiles) {
          const filePath = path.join(this.watchPath, file);
          console.log(`  - ${file}`);
          await this.handleNewPDF(filePath);
        }
      }
    } catch (error) {
      console.error('❌ Error processing existing PDFs:', error);
    }
  }

  private async handleNewPDF(filePath: string): Promise<void> {
    try {
      // Skip if already processed
      if (this.processedFiles.has(filePath)) {
        return;
      }

      const fileName = path.basename(filePath);
      console.log(`\n📄 Processing new PDF: ${fileName}`);

      // Extract text from PDF - TODO: Implement PDF text extraction
      const extractedText = "PDF text extraction not yet implemented";
      
      if (!extractedText || extractedText.trim().length === 0) {
        console.log(`⚠️  No text extracted from ${fileName}`);
        return;
      }

      console.log(`📝 Extracted ${extractedText.length} characters from ${fileName}`);

      // Extract Korean words
      const koreanWords = this.extractKoreanWords(extractedText);
      
      if (koreanWords.length === 0) {
        console.log(`⚠️  No Korean words found in ${fileName}`);
        return;
      }

      console.log(`🇰🇷 Found ${koreanWords.length} Korean words`);

      // Translate Korean words using AI
      const translatedWords = await this.translateKoreanWords(koreanWords, fileName);
      
      // Add words to database
      let addedCount = 0;
      for (const word of translatedWords) {
        try {
          // TODO: Implement addWord method in KoreanDatabase
          const success = true; // Placeholder
          
          if (success) {
            addedCount++;
            console.log(`  ✅ ${word.korean} = ${word.english}`);
          } else {
            console.log(`  ⚠️  ${word.korean} = ${word.english} (already exists)`);
          }
        } catch (error) {
          console.error(`  ❌ Error adding ${word.korean}:`, error);
        }
      }

      console.log(`\n🎉 Successfully added ${addedCount} new words from ${fileName}`);
      console.log(`📊 Total words in database: [Database count not implemented]`);
      
      // Mark as processed
      this.processedFiles.add(filePath);

    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error);
    }
  }

  private extractKoreanWords(text: string): string[] {
    // Korean character pattern
    const koreanPattern = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]+/g;
    const koreanMatches = text.match(koreanPattern) || [];
    
    // Remove duplicates and filter out very short words
    const uniqueKoreanWords = [...new Set(koreanMatches)]
      .filter(word => word.length >= 2) // At least 2 characters
      .slice(0, 30); // Limit to 30 words per PDF to avoid API limits

    return uniqueKoreanWords;
  }

  private async translateKoreanWords(koreanWords: string[], fileName: string): Promise<Array<{korean: string, english: string, difficulty?: string, isEssential?: boolean}>> {
    try {
      console.log('🤖 Translating Korean words with AI...');
      
      const prompt = `Please translate these Korean words to English and provide difficulty levels. 
      Format your response as JSON array with this structure:
      [
        {
          "korean": "한국어",
          "english": "English translation",
          "difficulty": "Beginner|Intermediate|Advanced",
          "isEssential": true/false
        }
      ]
      
      Korean words to translate: ${koreanWords.join(', ')}
      
      Mark words as essential if they are commonly used in daily conversation.`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a Korean language expert. Translate Korean words to English and assess their difficulty level and importance for learners."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      const translations = JSON.parse(response);
      
      console.log(`✅ AI translated ${translations.length} words`);
      return translations;

    } catch (error) {
      console.error('❌ Error translating words:', error);
      
      // Fallback: return words without translation
      return koreanWords.map(korean => ({
        korean,
        english: `[Translation needed: ${korean}]`,
        difficulty: 'Medium',
        isEssential: false
      }));
    }
  }
}

// Main execution
async function main() {
  const watcher = new SmartPDFWatcher();
  await watcher.startWatching();
}

if (require.main === module) {
  main().catch(console.error);
}

export { SmartPDFWatcher };
