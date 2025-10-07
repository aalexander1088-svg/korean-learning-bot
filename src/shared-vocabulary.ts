// Shared Korean vocabulary from your PDF lessons
// This ensures consistency across all bot components

export interface KoreanWord {
  korean: string;
  english: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export const PDF_VOCABULARY: KoreanWord[] = [
  // Basic words from your PDF
  { korean: '안녕하세요', english: 'Hello', difficulty: 'beginner' },
  { korean: '감사합니다', english: 'Thank you', difficulty: 'beginner' },
  { korean: '죄송합니다', english: 'Sorry', difficulty: 'beginner' },
  { korean: '네', english: 'Yes', difficulty: 'beginner' },
  { korean: '아니요', english: 'No', difficulty: 'beginner' },
  { korean: '물', english: 'Water', difficulty: 'beginner' },
  { korean: '밥', english: 'Rice/Food', difficulty: 'beginner' },
  { korean: '집', english: 'House', difficulty: 'beginner' },
  { korean: '학교', english: 'School', difficulty: 'beginner' },
  { korean: '친구', english: 'Friend', difficulty: 'beginner' },
  
  // Intermediate words from your PDF
  { korean: '가족', english: 'Family', difficulty: 'intermediate' },
  { korean: '사랑', english: 'Love', difficulty: 'intermediate' },
  { korean: '꿈', english: 'Dream', difficulty: 'intermediate' },
  { korean: '희망', english: 'Hope', difficulty: 'intermediate' },
  { korean: '노력', english: 'Effort', difficulty: 'intermediate' },
  { korean: '성공', english: 'Success', difficulty: 'intermediate' },
  { korean: '실패', english: 'Failure', difficulty: 'intermediate' },
  { korean: '도전', english: 'Challenge', difficulty: 'intermediate' },
  { korean: '기회', english: 'Opportunity', difficulty: 'intermediate' },
  { korean: '경험', english: 'Experience', difficulty: 'intermediate' },
  
  // Advanced words from your PDF
  { korean: '복잡한', english: 'Complicated', difficulty: 'advanced' },
  { korean: '단순하다', english: 'To be simple', difficulty: 'advanced' },
  { korean: '흡수하다', english: 'To absorb', difficulty: 'advanced' },
  { korean: '충격', english: 'Shock', difficulty: 'advanced' },
  { korean: '영향', english: 'Influence', difficulty: 'advanced' },
  { korean: '달리기', english: 'Running', difficulty: 'intermediate' },
  { korean: '그림', english: 'Painting', difficulty: 'intermediate' },
  { korean: '화가', english: 'Painter', difficulty: 'intermediate' },
  { korean: '벽', english: 'Wall', difficulty: 'intermediate' },
  { korean: '걸다', english: 'To hang', difficulty: 'intermediate' }
];

// Helper function to get random word from PDF vocabulary
export function getRandomPDFWord(): KoreanWord {
  return PDF_VOCABULARY[Math.floor(Math.random() * PDF_VOCABULARY.length)];
}

// Helper function to get words by difficulty
export function getWordsByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): KoreanWord[] {
  return PDF_VOCABULARY.filter(word => word.difficulty === difficulty);
}
