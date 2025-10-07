const { KoreanLearningEmailScript } = require('./dist/index');

async function testPDFAnalysis() {
  const script = new KoreanLearningEmailScript();
  
  const pdfText = `   ()     . 
 bedroom
 fridge ( cooling room+ freezing room) 
 freezer 
 =  to freeze
  to make ice cubes 
  for water to freeze 
    . 
  . () 
  . ()
 accommodation 
 relationship
 personality
 to be typical 
    
 behavior
 to follow /  
   . 
   . 
         .
 to grow (itself)
 to grow/raise something
 parasite 
    .
 to be nice, well-behaving 
 to be mild, soft, easy
  . 
     ,   .
  to mess around, prank, play 

 to bully 
      . []
 15 days /  full moon 
 angel <—>  devil
 to touch
       .   . 
N/  to watch out for N
 mountain range 
 stair
  indoor pool
  outdoor pool `;

  try {
    console.log('Testing AI analysis with PDF text...');
    const analysis = await script.analyzeKoreanContent(pdfText);
    
    console.log('\n=== AI ANALYSIS RESULT ===');
    console.log('Vocabulary count:', analysis.vocabulary.length);
    console.log('Vocabulary:', analysis.vocabulary);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testPDFAnalysis();



