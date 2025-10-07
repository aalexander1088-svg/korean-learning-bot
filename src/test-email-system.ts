import { KoreanLearningEmailScript } from './index';
import * as dotenv from 'dotenv';

dotenv.config();

async function testEmailSystem() {
  console.log('🧪 Testing Enhanced Korean Email System');
  console.log('=====================================');
  
  const emailScript = new KoreanLearningEmailScript();
  
  // Test with sample Korean text (simulating PDF content)
  const sampleKoreanText = `
안녕하세요! 오늘은 한국어 수업이에요.
예전에는 공사장에서 일했어요.
현재는 한국어를 배우고 있어요.
드디어 한국어를 잘하게 되었어요.
그림을 그리는 것을 좋아해요.
화가가 되고 싶어요.
벽에 그림을 걸어요.
`;

  console.log('📝 Sample Korean text:');
  console.log(sampleKoreanText);
  console.log('\n🤖 Analyzing with your personal vocabulary...');
  
  try {
    const analysis = await emailScript.analyzeKoreanContent(sampleKoreanText);
    
    console.log('\n📊 Analysis Results:');
    console.log(`✅ Vocabulary found: ${analysis.vocabulary.length} words`);
    console.log(`✅ Grammar patterns: ${analysis.grammar.length} patterns`);
    console.log(`✅ Practice sentences: ${analysis.practiceSentences.length} sentences`);
    console.log(`✅ Review words: ${analysis.reviewWords.length} words`);
    console.log(`✅ Quiz questions: ${analysis.quiz.length} questions`);
    
    console.log('\n📚 Sample Vocabulary:');
    analysis.vocabulary.slice(0, 3).forEach((word, index) => {
      console.log(`${index + 1}. ${word.korean} - ${word.english}`);
    });
    
    console.log('\n🔄 Sample Review Words (from your database):');
    analysis.reviewWords.slice(0, 3).forEach((word, index) => {
      console.log(`${index + 1}. ${word.korean} - ${word.english} (${word.reviewType})`);
    });
    
    console.log('\n✍️ Sample Practice Sentence:');
    if (analysis.practiceSentences.length > 0) {
      const sentence = analysis.practiceSentences[0];
      console.log(`Korean: ${sentence.korean}`);
      console.log(`English: ${sentence.english}`);
    }
    
    console.log('\n🧠 Sample Quiz Question:');
    if (analysis.quiz.length > 0) {
      const question = analysis.quiz[0];
      console.log(`Q: ${question.question}`);
      console.log(`A) ${question.options[0]}`);
      console.log(`B) ${question.options[1]}`);
      console.log(`C) ${question.options[2]}`);
      console.log(`D) ${question.options[3]}`);
      console.log(`Correct Answer: ${question.correctAnswer}`);
      console.log(`Explanation: ${question.explanation}`);
    }
    
    console.log('\n🎉 Enhanced email system is working!');
    console.log('📧 Your morning emails will now include:');
    console.log('   • Your personal vocabulary in practice sentences');
    console.log('   • Review words from your database');
    console.log('   • Quiz questions using your vocabulary');
    console.log('   • New vocabulary from PDFs automatically stored');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testEmailSystem().catch(console.error);






