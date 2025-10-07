import * as cron from 'node-cron';
import * as fs from 'fs';
import * as path from 'path';
import { KoreanLearningEmailScript } from './index';
import { KoreanDatabase } from './database';
import { NewsEmailBot } from './news-email-bot';
import { GoogleDocsService } from './google-docs-service';
import { PDFUploader } from './pdf-uploader';

class KoreanLearningScheduler {
  private emailScript: KoreanLearningEmailScript;
  private database: KoreanDatabase;
  private newsBot: NewsEmailBot;
  private googleDocs: GoogleDocsService;
  private pdfUploader: PDFUploader;
  private desktopPath: string;

  constructor() {
    this.emailScript = new KoreanLearningEmailScript();
    this.database = new KoreanDatabase();
    this.newsBot = new NewsEmailBot();
    this.googleDocs = new GoogleDocsService();
    this.pdfUploader = new PDFUploader();
    this.desktopPath = path.join(process.env.USERPROFILE || '', 'Desktop');
    
    console.log('🕐 Korean Learning Scheduler initialized');
    console.log(`📁 Monitoring desktop: ${this.desktopPath}`);
  }

  private findKoreanPDF(): string | null {
    try {
      // First check the "korean class notes" folder
      const koreanClassNotesPath = path.join(this.desktopPath, 'korean class notes');
      if (fs.existsSync(koreanClassNotesPath)) {
        const files = fs.readdirSync(koreanClassNotesPath);
        const pdfFiles = files.filter(file => 
          file.toLowerCase().endsWith('.pdf') && 
          (file.toLowerCase().includes('korean') || file.toLowerCase().includes('한국'))
        );

        if (pdfFiles.length > 0) {
          // Sort by modification time to get the newest
          const sortedPdfs = pdfFiles.sort((a, b) => {
            const statA = fs.statSync(path.join(koreanClassNotesPath, a));
            const statB = fs.statSync(path.join(koreanClassNotesPath, b));
            return statB.mtime.getTime() - statA.mtime.getTime();
          });
          
          const pdfPath = path.join(koreanClassNotesPath, sortedPdfs[0]);
          console.log(`📄 Found newest Korean PDF: ${sortedPdfs[0]}`);
          return pdfPath;
        }
      }

      // Fallback to desktop root
      const files = fs.readdirSync(this.desktopPath);
      const pdfFiles = files.filter(file => 
        file.toLowerCase().endsWith('.pdf') && 
        (file.toLowerCase().includes('korean') || file.toLowerCase().includes('한국'))
      );

      if (pdfFiles.length > 0) {
        const pdfPath = path.join(this.desktopPath, pdfFiles[0]);
        console.log(`📄 Found Korean PDF: ${pdfFiles[0]}`);
        return pdfPath;
      }

      console.log('❌ No Korean PDF found on desktop');
      return null;
    } catch (error) {
      console.error('❌ Error reading desktop directory:', error);
      return null;
    }
  }

  private async processKoreanLearningFromPDF(): Promise<void> {
    try {
      console.log('📚 Starting Korean learning from PDF...');
      
      let pdfPath: string | null = null;
      
      // Check if running in GitHub Actions (cloud) or locally
      if (process.env.GITHUB_ACTIONS) {
        console.log('☁️ Running in GitHub Actions - using uploaded PDF');
        // Look for PDF in the pdfs directory
        const pdfsDir = 'pdfs';
        if (fs.existsSync(pdfsDir)) {
          const files = fs.readdirSync(pdfsDir);
          const pdfFiles = files.filter(file => 
            file.toLowerCase().endsWith('.pdf') && 
            (file.toLowerCase().includes('korean') || file.toLowerCase().includes('한국'))
          );
          
          if (pdfFiles.length > 0) {
            // Sort by modification time to get the newest
            const sortedPdfs = pdfFiles.sort((a, b) => {
              const statA = fs.statSync(path.join(pdfsDir, a));
              const statB = fs.statSync(path.join(pdfsDir, b));
              return statB.mtime.getTime() - statA.mtime.getTime();
            });
            
            pdfPath = path.join(pdfsDir, sortedPdfs[0]);
            console.log(`📄 Using uploaded PDF: ${sortedPdfs[0]}`);
          }
        }
        
        if (!pdfPath) {
          console.log('⏭️ Skipping PDF email - no uploaded PDF found in GitHub');
          return;
        }
      } else {
        console.log('💻 Running locally - using desktop PDF');
        pdfPath = this.findKoreanPDF();
        if (!pdfPath) {
          console.log('⏭️ Skipping PDF email - no Korean PDF found on desktop');
          return;
        }
        
        // Upload PDF to GitHub for future cloud runs
        console.log('📤 Uploading PDF to GitHub for future cloud runs...');
        await this.pdfUploader.uploadNewestPDF();
      }

      // Extract text from PDF first, then analyze
      const pdfText = await this.emailScript.extractTextFromPDF(pdfPath);
      const analysis = await this.emailScript.analyzeKoreanContent(pdfText);
      
      // Get review words from database for spaced repetition
      const reviewWords = await this.database.getWordsForSpacedRepetition(7);
      const essentialWords = await this.database.getEssentialWords();
      
      // Add review words to analysis
      analysis.reviewWords = [
        ...reviewWords.slice(0, 3).map(word => ({
          korean: word.korean,
          english: word.english,
          reviewType: 'spaced_repetition' as const
        })),
        ...essentialWords.slice(0, 2).map(word => ({
          korean: word.korean,
          english: word.english,
          reviewType: 'essential' as const
        }))
      ];
      
      // Store vocabulary and grammar in database
      await this.database.storeVocabulary(analysis.vocabulary);
      await this.database.storeGrammar(analysis.grammar);
      
      // Mark some common words as essential
      const commonWords = ['예전에는', '전혀', '현재', '드디어', '방법', '대부분', '이유'];
      for (const word of commonWords) {
        await this.database.markWordAsEssential(word);
      }
      
      // Generate and send email
      const sourceName = process.env.GITHUB_ACTIONS ? 'Korean Class PDF (Cloud)' : 'Korean Class PDF';
      const htmlContent = this.emailScript.generateHTMLEmail(analysis, sourceName);
      const recipientEmail = process.env.DEFAULT_EMAIL || 'aalexander1088@gmail.com';
      
      await this.emailScript.sendEmail(htmlContent, recipientEmail, sourceName);
      
      console.log('✅ Korean learning email from PDF sent successfully!');
      
    } catch (error) {
      console.error('❌ Error in Korean learning from PDF process:', error);
    }
  }

  private async processKoreanLearningFromGoogleDoc(): Promise<void> {
    try {
      console.log('📚 Starting Korean learning from Google Doc...');
      
      // Get Google Doc ID from environment variable
      const googleDocId = process.env.GOOGLE_DOC_ID;
      if (!googleDocId) {
        console.log('⏭️ Skipping Google Doc email - no Google Doc ID configured');
        return;
      }

      // Get recent vocabulary from Google Doc (last 50 lines)
      const recentText = await this.googleDocs.getRecentVocabulary(googleDocId, 50);
      
      if (!recentText || recentText.trim().length === 0) {
        console.log('⏭️ Skipping Google Doc email - no recent vocabulary found in Google Doc');
        return;
      }
      
      // Analyze Korean content from Google Doc
      const analysis = await this.emailScript.analyzeKoreanContent(recentText);
      
      // Get review words from database for spaced repetition
      const reviewWords = await this.database.getWordsForSpacedRepetition(7);
      const essentialWords = await this.database.getEssentialWords();
      
      // Add review words to analysis
      analysis.reviewWords = [
        ...reviewWords.slice(0, 3).map(word => ({
          korean: word.korean,
          english: word.english,
          reviewType: 'spaced_repetition' as const
        })),
        ...essentialWords.slice(0, 2).map(word => ({
          korean: word.korean,
          english: word.english,
          reviewType: 'essential' as const
        }))
      ];
      
      // Store vocabulary and grammar in database
      await this.database.storeVocabulary(analysis.vocabulary);
      await this.database.storeGrammar(analysis.grammar);
      
      // Mark some common words as essential
      const commonWords = ['예전에는', '전혀', '현재', '드디어', '방법', '대부분', '이유'];
      for (const word of commonWords) {
        await this.database.markWordAsEssential(word);
      }
      
      // Generate and send email
      const htmlContent = this.emailScript.generateHTMLEmail(analysis, 'Google Doc');
      const recipientEmail = process.env.DEFAULT_EMAIL || 'aalexander1088@gmail.com';
      
      await this.emailScript.sendEmail(htmlContent, recipientEmail, 'Google Doc');
      
      console.log('✅ Korean learning email from Google Doc sent successfully!');
      
    } catch (error) {
      console.error('❌ Error in Korean learning from Google Doc process:', error);
    }
  }

  private async processNewsDigest(): Promise<void> {
    try {
      console.log('📰 Starting news digest process...');
      await this.newsBot.sendNewsDigest();
      console.log('✅ News digest sent successfully!');
    } catch (error) {
      console.error('❌ Error in news digest process:', error);
    }
  }

  public startScheduler(): void {
    console.log('🚀 Starting Korean Learning Scheduler...');
    
    // Schedule Korean learning from PDF at 5:00 AM
    cron.schedule('0 5 * * *', () => {
      console.log('⏰ 5:00 AM - Time for Korean learning from PDF!');
      this.processKoreanLearningFromPDF();
    }, {
      scheduled: true,
      timezone: "America/New_York" // Adjust timezone as needed
    });

    // Schedule Korean learning from Google Doc at 5:05 AM (5 minutes later)
    cron.schedule('5 5 * * *', () => {
      console.log('⏰ 5:05 AM - Time for Korean learning from Google Doc!');
      this.processKoreanLearningFromGoogleDoc();
    }, {
      scheduled: true,
      timezone: "America/New_York" // Adjust timezone as needed
    });

    // Schedule news digest at 5:10 AM (10 minutes later)
    cron.schedule('10 5 * * *', () => {
      console.log('⏰ 5:10 AM - Time for news digest!');
      this.processNewsDigest();
    }, {
      scheduled: true,
      timezone: "America/New_York" // Adjust timezone as needed
    });

    // Optional: Also run immediately for testing
    if (process.argv.includes('--test')) {
      console.log('🧪 Running test immediately...');
      setTimeout(() => this.processKoreanLearningFromPDF(), 2000);
      setTimeout(() => this.processKoreanLearningFromGoogleDoc(), 5000);
      setTimeout(() => this.processNewsDigest(), 8000);
      
      // Auto-exit after test completes
      setTimeout(() => {
        console.log('✅ Test completed! Exiting...');
        this.database.close();
        process.exit(0);
      }, 15000); // Exit after 15 seconds
    }

    // Run news digest immediately if --news flag is provided
    if (process.argv.includes('--news')) {
      console.log('📰 Running news digest immediately...');
      setTimeout(() => this.processNewsDigest(), 2000);
    }

    console.log('✅ Scheduler started:');
    console.log('   📚 Korean learning from PDF: Daily at 5:00 AM');
    console.log('   📚 Korean learning from Google Doc: Daily at 5:05 AM');
    console.log('   📰 News digest emails: Daily at 5:10 AM');
    console.log('💡 Use Ctrl+C to stop the scheduler');
    console.log('💡 Use --news flag to run news digest immediately');
    
    // Keep the process running
    process.on('SIGINT', () => {
      console.log('\n👋 Stopping Korean Learning Scheduler...');
      this.database.close();
      process.exit(0);
    });
  }
}

// Start the scheduler
const scheduler = new KoreanLearningScheduler();
scheduler.startScheduler();
