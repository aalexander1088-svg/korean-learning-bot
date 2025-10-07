import { KoreanLearningEmailScript } from './index';
import * as dotenv from 'dotenv';

dotenv.config();

async function sendImprovedTestEmail() {
  console.log('📧 Sending Improved Test Email');
  console.log('==============================');
  
  const emailScript = new KoreanLearningEmailScript();
  
  // Better sample Korean text with more advanced vocabulary
  const sampleKoreanText = `
한국어 수업 노트

오늘은 복잡한 문법을 배웠어요.

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

  console.log('📝 Improved Korean content:');
  console.log(sampleKoreanText);
  console.log('\n🤖 Analyzing with filtered vocabulary...');
  
  try {
    // Analyze the Korean content directly
    const analysis = await emailScript.analyzeKoreanContent(sampleKoreanText);
    
    console.log('✅ Analysis complete!');
    console.log(`📚 Found ${analysis.vocabulary.length} vocabulary words (filtered)`);
    console.log(`📝 Found ${analysis.grammar.length} grammar patterns`);
    console.log(`✍️ Created ${analysis.practiceSentences.length} practice sentences`);
    console.log(`🔄 Selected ${analysis.reviewWords.length} review words from your database`);
    console.log(`🧠 Generated ${analysis.quiz.length} quiz questions`);
    
    console.log('\n📊 Filtered Vocabulary Preview:');
    analysis.vocabulary.forEach((word, index) => {
      console.log(`${index + 1}. ${word.korean} - ${word.english}`);
    });
    
    console.log('\n✍️ Sample Practice Sentences:');
    analysis.practiceSentences.slice(0, 3).forEach((sentence, index) => {
      console.log(`${index + 1}. ${sentence.korean}`);
      console.log(`   ${sentence.english}`);
    });
    
    // Generate HTML email content
    const htmlContent = emailScript.generateHTMLEmail(analysis, 'Korean Class Notes');
    
    // Send email directly
    await emailScript.sendEmail(htmlContent, process.env.EMAIL_USER || 'aalexander1088@gmail.com', 'Korean Class Notes');
    
    console.log('\n✅ Improved test email sent successfully!');
    console.log('📬 Check your inbox for the enhanced Korean learning email!');
    console.log('\n🎯 Improvements made:');
    console.log('   • Filtered out basic words (안녕하세요, 오늘, etc.)');
    console.log('   • Better, more natural sentence generation');
    console.log('   • Focus on meaningful vocabulary only');
    console.log('   • More realistic Korean expressions');
    
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
    console.log('\n🔧 Make sure your email credentials are set in the .env file:');
    console.log('   EMAIL_USER=your-email@gmail.com');
    console.log('   EMAIL_PASSWORD=your-app-password');
    console.log('   OPENAI_API_KEY=your-openai-key');
  }
}

sendImprovedTestEmail().catch(console.error);





