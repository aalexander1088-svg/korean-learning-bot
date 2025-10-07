import { KoreanLearningEmailScript } from './index';
import * as dotenv from 'dotenv';

dotenv.config();

async function sendTestEmail() {
  console.log('📧 Sending Test Email with Your Vocabulary');
  console.log('==========================================');
  
  const emailScript = new KoreanLearningEmailScript();
  
  // Sample Korean text (simulating your class notes)
  const sampleKoreanText = `
안녕하세요! 오늘은 한국어 수업이에요.

예전에는 공사장에서 일했어요. 현재는 한국어를 배우고 있어요.
드디어 한국어를 잘하게 되었어요.

그림을 그리는 것을 좋아해요. 화가가 되고 싶어요.
벽에 그림을 걸어요.

오늘은 새로운 단어들을 배웠어요:
- 달리기 (running)
- 그림 (painting) 
- 화가 (painter)
- 벽 (wall)
- 걸다 (to hang)

문법 패턴:
- V-고 싶어요 (want to do)
- N-을/를 좋아해요 (like to do)

예문:
- 그림을 그리는 것을 좋아해요.
- 화가가 되고 싶어요.
- 벽에 그림을 걸어요.
`;

  console.log('📝 Processing Korean text...');
  console.log('🤖 Analyzing with your personal vocabulary...');
  
  try {
    // Create a temporary PDF file for testing
    const fs = require('fs');
    const path = require('path');
    const tempPdfPath = path.join(__dirname, 'temp-korean-notes.pdf');
    
    // Write sample text to a file (simulating PDF content)
    fs.writeFileSync(tempPdfPath.replace('.pdf', '.txt'), sampleKoreanText);
    
    console.log('📄 Sample Korean content prepared');
    console.log('📧 Generating personalized email...');
    
    // Process the content and send email
    await emailScript.processPDF(tempPdfPath.replace('.pdf', '.txt'), process.env.EMAIL_USER || 'aalexander1088@gmail.com');
    
    console.log('✅ Test email sent successfully!');
    console.log('📬 Check your inbox for the personalized Korean learning email!');
    console.log('\n🎯 Your email includes:');
    console.log('   • Your personal vocabulary in practice sentences');
    console.log('   • Review words from your 182-word database');
    console.log('   • Quiz questions using your vocabulary');
    console.log('   • Grammar patterns from the sample text');
    
    // Clean up temp file
    try {
      fs.unlinkSync(tempPdfPath.replace('.pdf', '.txt'));
    } catch (e) {
      // Ignore cleanup errors
    }
    
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
    console.log('\n🔧 Make sure your email credentials are set in the .env file:');
    console.log('   EMAIL_USER=your-email@gmail.com');
    console.log('   EMAIL_PASSWORD=your-app-password');
  }
}

sendTestEmail().catch(console.error);






