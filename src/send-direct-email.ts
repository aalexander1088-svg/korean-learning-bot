import { KoreanLearningEmailScript } from './index';
import * as dotenv from 'dotenv';

dotenv.config();

async function sendDirectTestEmail() {
  console.log('📧 Sending Direct Test Email with Your Vocabulary');
  console.log('================================================');
  
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

  console.log('📝 Sample Korean content:');
  console.log(sampleKoreanText);
  console.log('\n🤖 Analyzing with your personal vocabulary...');
  
  try {
    // Analyze the Korean content directly
    const analysis = await emailScript.analyzeKoreanContent(sampleKoreanText);
    
    console.log('✅ Analysis complete!');
    console.log(`📚 Found ${analysis.vocabulary.length} vocabulary words`);
    console.log(`📝 Found ${analysis.grammar.length} grammar patterns`);
    console.log(`✍️ Created ${analysis.practiceSentences.length} practice sentences`);
    console.log(`🔄 Selected ${analysis.reviewWords.length} review words from your database`);
    console.log(`🧠 Generated ${analysis.quiz.length} quiz questions`);
    
    // Generate HTML email content
    const htmlContent = emailScript.generateHTMLEmail(analysis, 'Korean Class Notes');
    
    // Send email directly
    await emailScript.sendEmail(htmlContent, process.env.EMAIL_USER || 'aalexander1088@gmail.com', 'Korean Class Notes');
    
    console.log('\n✅ Test email sent successfully!');
    console.log('📬 Check your inbox for the personalized Korean learning email!');
    console.log('\n🎯 Your email includes:');
    console.log('   • Your personal vocabulary in practice sentences');
    console.log('   • Review words from your 182-word database');
    console.log('   • Quiz questions using your vocabulary');
    console.log('   • Grammar patterns from the sample text');
    console.log('   • Beautiful HTML formatting');
    
    console.log('\n📊 Sample Content Preview:');
    console.log('📚 Vocabulary:', analysis.vocabulary.slice(0, 3).map(v => `${v.korean} - ${v.english}`).join(', '));
    console.log('🔄 Review Words:', analysis.reviewWords.slice(0, 3).map(v => `${v.korean} (${v.reviewType})`).join(', '));
    console.log('✍️ Practice Sentence:', analysis.practiceSentences[0]?.korean);
    
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
    console.log('\n🔧 Make sure your email credentials are set in the .env file:');
    console.log('   EMAIL_USER=your-email@gmail.com');
    console.log('   EMAIL_PASSWORD=your-app-password');
    console.log('   OPENAI_API_KEY=your-openai-key');
  }
}

sendDirectTestEmail().catch(console.error);






