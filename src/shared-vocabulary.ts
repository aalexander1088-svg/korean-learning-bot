// Shared Korean vocabulary from your actual PDF lessons
// This ensures consistency across all bot components

export interface KoreanWord {
  korean: string;
  english: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export const PDF_VOCABULARY: KoreanWord[] = [
  // Words from your actual PDF
  { korean: '침실', english: 'bedroom', difficulty: 'beginner' },
  { korean: '냉장고', english: 'fridge', difficulty: 'beginner' },
  { korean: '냉동고', english: 'freezer', difficulty: 'beginner' },
  { korean: '냉동하다', english: 'to freeze', difficulty: 'intermediate' },
  { korean: '얼리다', english: 'to freeze', difficulty: 'intermediate' },
  { korean: '얼음', english: 'ice', difficulty: 'beginner' },
  { korean: '회사', english: 'company', difficulty: 'beginner' },
  { korean: '팔다', english: 'to sell', difficulty: 'intermediate' },
  { korean: '팔리다', english: 'to be sold', difficulty: 'intermediate' },
  { korean: '숙소', english: 'accommodation', difficulty: 'intermediate' },
  { korean: '관계', english: 'relationship', difficulty: 'intermediate' },
  { korean: '성격', english: 'personality', difficulty: 'intermediate' },
  { korean: '전형적이다', english: 'to be typical', difficulty: 'advanced' },
  { korean: '행동', english: 'behavior', difficulty: 'intermediate' },
  { korean: '따르다', english: 'to follow', difficulty: 'intermediate' },
  { korean: '따라가다', english: 'to follow', difficulty: 'intermediate' },
  { korean: '따라다니다', english: 'to follow around', difficulty: 'advanced' },
  { korean: '자라다', english: 'to grow (itself)', difficulty: 'intermediate' },
  { korean: '키우다', english: 'to grow/raise something', difficulty: 'intermediate' },
  { korean: '기생충', english: 'parasite', difficulty: 'advanced' },
  { korean: '착하다', english: 'to be nice, well-behaving', difficulty: 'intermediate' },
  { korean: '순하다', english: 'to be mild, soft, easy', difficulty: 'intermediate' },
  { korean: '장난을 치다', english: 'to mess around, prank, play', difficulty: 'advanced' },
  { korean: '괴롭히다', english: 'to bully', difficulty: 'intermediate' },
  { korean: '보름', english: '15 days', difficulty: 'intermediate' },
  { korean: '보름달', english: 'full moon', difficulty: 'intermediate' },
  { korean: '천사', english: 'angel', difficulty: 'beginner' },
  { korean: '악마', english: 'devil', difficulty: 'beginner' },
  { korean: '만지다', english: 'to touch', difficulty: 'intermediate' },
  { korean: '조심하다', english: 'to watch out for', difficulty: 'intermediate' },
  { korean: '산맥', english: 'mountain range', difficulty: 'intermediate' },
  { korean: '계단', english: 'stair', difficulty: 'beginner' },
  { korean: '실내 수영장', english: 'indoor pool', difficulty: 'intermediate' },
  { korean: '야외 수영장', english: 'outdoor pool', difficulty: 'intermediate' },
  { korean: '아내', english: 'wife', difficulty: 'intermediate' },
  { korean: '시끄럽다', english: 'to be noisy', difficulty: 'intermediate' },
  { korean: '부엌', english: 'kitchen', difficulty: 'beginner' },
  { korean: '수업', english: 'class/lesson', difficulty: 'intermediate' },
  { korean: '추워서', english: 'because it\'s cold', difficulty: 'intermediate' },
  { korean: '밖에', english: 'outside', difficulty: 'beginner' },
  { korean: '고양이', english: 'cat', difficulty: 'beginner' },
  { korean: '항상', english: 'always', difficulty: 'intermediate' },
  { korean: '사람', english: 'person', difficulty: 'beginner' },
  { korean: '두 명', english: 'two people', difficulty: 'beginner' },
  { korean: '한 사람', english: 'one person', difficulty: 'beginner' },
  { korean: '진짜', english: 'really', difficulty: 'intermediate' },
  { korean: '착하게', english: 'nicely', difficulty: 'intermediate' },
  { korean: '생기다', english: 'to look like', difficulty: 'intermediate' },
  { korean: '처제', english: 'sister-in-law', difficulty: 'advanced' },
  { korean: '아기', english: 'baby', difficulty: 'beginner' },
  { korean: '매운 음식', english: 'spicy food', difficulty: 'intermediate' },
  { korean: '떡볶이', english: 'tteokbokki', difficulty: 'intermediate' },
  { korean: '만들다', english: 'to make', difficulty: 'intermediate' },
  { korean: '다이노', english: 'Dino (cat name)', difficulty: 'beginner' },
  { korean: '에너지', english: 'energy', difficulty: 'intermediate' },
  { korean: '다른', english: 'other', difficulty: 'intermediate' },
  { korean: '무니', english: 'Muni (cat name)', difficulty: 'beginner' },
  { korean: '물다', english: 'to bite', difficulty: 'intermediate' }
];

// Helper function to get random word from PDF vocabulary
export function getRandomPDFWord(): KoreanWord {
  return PDF_VOCABULARY[Math.floor(Math.random() * PDF_VOCABULARY.length)];
}

// Helper function to get words by difficulty
export function getWordsByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): KoreanWord[] {
  return PDF_VOCABULARY.filter(word => word.difficulty === difficulty);
}
