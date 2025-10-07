#!/usr/bin/env node

// Test Korean text detection
function containsKoreanText(text: string): boolean {
  // Korean Unicode range: \uAC00-\uD7AF (Hangul Syllables)
  // Also includes \u1100-\u11FF (Hangul Jamo) and \u3130-\u318F (Hangul Compatibility Jamo)
  return /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(text);
}

function extractKoreanWord(text: string): string {
  // Extract only Korean characters, remove spaces and punctuation
  return text.replace(/[^\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/g, '').trim();
}

// Test cases
const testCases = [
  '합치다',
  '안녕하세요',
  'hello',
  '안녕 hello',
  '123',
  '가나다라',
  'ㅋㅋㅋ'
];

console.log('🧪 Testing Korean text detection...\n');

testCases.forEach(testCase => {
  const hasKorean = containsKoreanText(testCase);
  const extracted = extractKoreanWord(testCase);
  
  console.log(`Input: "${testCase}"`);
  console.log(`Contains Korean: ${hasKorean}`);
  console.log(`Extracted: "${extracted}"`);
  console.log('---');
});

console.log('\n✅ Test complete!');
