import { KoreanDatabase } from './database';

async function showVocabularyReview() {
  const database = new KoreanDatabase();
  
  try {
    console.log('📚 Korean Vocabulary Review');
    console.log('============================');
    
    const vocabulary = await database.getAllVocabulary();
    
    if (vocabulary.length === 0) {
      console.log('❌ No vocabulary found in database');
      return;
    }

    console.log(`📖 Found ${vocabulary.length} vocabulary words\n`);
    
    // Show first 20 words for review
    const wordsToReview = vocabulary.slice(0, 20);
    
    wordsToReview.forEach((word, index) => {
      console.log(`${index + 1}. Korean: ${word.korean}`);
      console.log(`   English: ${word.english}`);
      console.log(`   Added: ${word.dateAdded}`);
      console.log(`   Reviews: ${word.reviewCount}`);
      console.log('');
    });
    
    console.log(`\n📊 Showing ${wordsToReview.length} of ${vocabulary.length} total words`);
    console.log('💡 Use "npm run review" for interactive practice');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    database.close();
  }
}

// Run the review
showVocabularyReview();






