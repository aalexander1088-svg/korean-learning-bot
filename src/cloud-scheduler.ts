import * as fs from 'fs';
import * as path from 'path';
import { KoreanLearningEmailScript } from './index';
import { KoreanDatabase } from './database';
import * as dotenv from 'dotenv';

dotenv.config();

class CloudKoreanScheduler {
  private emailScript: KoreanLearningEmailScript;
  private database: KoreanDatabase;

  constructor() {
    this.emailScript = new KoreanLearningEmailScript();
    this.database = new KoreanDatabase();
    
    console.log('☁️ Cloud Korean Learning Scheduler initialized');
  }

  private getSampleKoreanContent(): string {
    return `
한국어 수업 노트 - Daily Review

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
      console.log('🚀 Starting cloud-based Korean learning email...');
      
      // Use sample content for cloud execution
      const content = this.getSampleKoreanContent();
      console.log('📝 Using sample Korean content for cloud execution');
      
      // Get recipient email
      const recipientEmail = process.env.EMAIL_USER || 'aalexander1088@gmail.com';
      
      // Analyze content and generate email
      const analysis = await this.emailScript.analyzeKoreanContent(content);
      
      // Store new vocabulary
      if (analysis.vocabulary && analysis.vocabulary.length > 0) {
        console.log('💾 Storing new vocabulary in database...');
        await this.database.storeVocabulary(analysis.vocabulary);
        console.log(`✅ Stored ${analysis.vocabulary.length} new vocabulary words`);
      }
      
      // Generate and send email
      const htmlContent = this.emailScript.generateHTMLEmail(analysis, 'Daily Korean Review');
      await this.emailScript.sendEmail(htmlContent, recipientEmail, 'Daily Korean Review');
      
      console.log('✅ Cloud-based Korean learning email sent successfully!');
      
    } catch (error) {
      console.error('❌ Error sending cloud-based email:', error);
      
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
    const scheduler = new CloudKoreanScheduler();
    await scheduler.sendDailyEmail();
    await scheduler.close();
    console.log('🎉 Cloud-based daily email process completed!');
  } catch (error) {
    console.error('💥 Cloud-based daily email process failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { CloudKoreanScheduler };




