const { KoreanLearningEmailScript } = require('./dist/index');

async function testPDFExtraction() {
  const script = new KoreanLearningEmailScript();
  
  try {
    console.log('Testing PDF text extraction...');
    const text = await script.extractTextFromPDF('C:\\Users\\aalex\\Desktop\\korean class notes\\korean lesson 2.pdf');
    
    console.log('\n=== EXTRACTED TEXT ===');
    console.log(text);
    
    console.log('\n=== KOREAN WORDS FOUND ===');
    const koreanWords = text.match(/[가-힣]{3,}/g) || [];
    const uniqueWords = [...new Set(koreanWords)];
    console.log('Unique Korean words (3+ characters):', uniqueWords);
    console.log('Total count:', uniqueWords.length);
    
    console.log('\n=== TESTING AI ANALYSIS ===');
    const analysis = await script.analyzeKoreanContent(text);
    console.log('AI extracted vocabulary count:', analysis.vocabulary.length);
    console.log('AI vocabulary:', analysis.vocabulary);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testPDFExtraction();



