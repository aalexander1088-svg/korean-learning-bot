import * as fs from 'fs';
import * as path from 'path';
import { KoreanLearningEmailScript } from './index';
import { KoreanDatabase } from './database';
import * as dotenv from 'dotenv';

dotenv.config();

class ReliableKoreanScheduler {
  private emailScript: KoreanLearningEmailScript;
  private database: KoreanDatabase;
  private desktopPath: string;

  constructor() {
    this.emailScript = new KoreanLearningEmailScript();
    this.database = new KoreanDatabase();
    this.desktopPath = path.join(process.env.USERPROFILE || '', 'Desktop');
    
    console.log('🕐 Reliable Korean Learning Scheduler initialized');
    console.log(`📁 Monitoring desktop: ${this.desktopPath}`);
  }

  private findKoreanPDF(): string | null {
    try {
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
      
      return null;
    } catch (error) {
      console.error('❌ Error reading desktop directory:', error);
      return null;
    }
  }

  private findKoreanTextFile(): string | null {
    try {
      const files = fs.readdirSync(this.desktopPath);
      const textFiles = files.filter(file => 
        file.toLowerCase().endsWith('.txt') && 
        (file.toLowerCase().includes('korean') || file.toLowerCase().includes('한국'))
      );
      
      if (textFiles.length > 0) {
        const textPath = path.join(this.desktopPath, textFiles[0]);
        console.log(`📄 Found Korean text file: ${textFiles[0]}`);
        return textPath;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error reading desktop directory:', error);
      return null;
    }
  }

  private getSampleKoreanContent(): string {
    return `
한국어 수업 노트

오늘은 새로운 단어들을 배웠어요.

예전에는 공사장에서 일했어요. 현재는 한국어를 배우고 있어요.
드디어 한국어를 잘하게 되었어요.

그림을 그리는 것을 좋아해요. 화가가 되고 싶어요.
벽에 그림을 걸어요.

새로운 단어들:
- 달리기 (running)
- 그림 (painting) 
- 화가 (painter)
- 벽 (wall)
- 걸다 (to hang)
- 복잡한 (complicated)
- 단순하다 (to be simple)
- 흡수하다 (to absorb)
- 충격 (shock)
- 영향 (influence)

문법 패턴:
- V-고 싶어요 (want to do)
- N-을/를 좋아해요 (like to do)
- V-어/아 있다 (ongoing action)

예문:
- 그림을 그리는 것을 좋아해요.
- 화가가 되고 싶어요.
- 벽에 그림을 걸어요.
- 고양이가 소파에 앉아 있어요.
`;
  }

  async sendDailyEmail(): Promise<void> {
    try {
      console.log('🚀 Starting daily Korean learning email...');
      
      // Try to find Korean PDF first
      let koreanFile = this.findKoreanPDF();
      let isTextFile = false;
      
      // If no PDF, try text file
      if (!koreanFile) {
        koreanFile = this.findKoreanTextFile();
        isTextFile = true;
      }
      
      // If no files found, use sample content
      if (!koreanFile) {
        console.log('📝 No Korean files found, using sample content');
        koreanFile = path.join(__dirname, 'sample-korean-notes.txt');
        isTextFile = true;
        
        // Create sample file if it doesn't exist
        if (!fs.existsSync(koreanFile)) {
          fs.writeFileSync(koreanFile, this.getSampleKoreanContent());
        }
      }
      
      console.log(`📄 Using file: ${koreanFile}`);
      
      // Get recipient email
      const recipientEmail = process.env.EMAIL_USER || 'aalexander1088@gmail.com';
      
      if (isTextFile) {
        // For text files, read content and analyze directly
        const content = fs.readFileSync(koreanFile, 'utf-8');
        const analysis = await this.emailScript.analyzeKoreanContent(content);
        
        // Store new vocabulary
        if (analysis.vocabulary && analysis.vocabulary.length > 0) {
          console.log('💾 Storing new vocabulary in database...');
          await this.database.storeVocabulary(analysis.vocabulary);
          console.log(`✅ Stored ${analysis.vocabulary.length} new vocabulary words`);
        }
        
        // Generate and send email
        const htmlContent = this.emailScript.generateHTMLEmail(analysis, path.basename(koreanFile));
        await this.emailScript.sendEmail(htmlContent, recipientEmail, path.basename(koreanFile));
        
      } else {
        // For PDF files, use the existing processPDF method
        await this.emailScript.processPDF(koreanFile, recipientEmail);
      }
      
      console.log('✅ Daily Korean learning email sent successfully!');
      
    } catch (error) {
      console.error('❌ Error sending daily email:', error);
      
      // Try to send a fallback email
      try {
        console.log('🔄 Attempting to send fallback email...');
        const fallbackContent = this.getSampleKoreanContent();
        const analysis = await this.emailScript.analyzeKoreanContent(fallbackContent);
        const htmlContent = this.emailScript.generateHTMLEmail(analysis, 'Korean Review');
        await this.emailScript.sendEmail(htmlContent, process.env.EMAIL_USER || 'aalexander1088@gmail.com', 'Korean Review');
        console.log('✅ Fallback email sent successfully!');
      } catch (fallbackError) {
        console.error('❌ Fallback email also failed:', fallbackError);
      }
    }
  }

  async close(): Promise<void> {
    await this.database.close();
  }
}

// Main execution
async function main(): Promise<void> {
  try {
    const scheduler = new ReliableKoreanScheduler();
    await scheduler.sendDailyEmail();
    await scheduler.close();
    console.log('🎉 Daily email process completed!');
  } catch (error) {
    console.error('💥 Daily email process failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { ReliableKoreanScheduler };





