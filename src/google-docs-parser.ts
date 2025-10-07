import { google } from 'googleapis';
import * as dotenv from 'dotenv';

dotenv.config();

export interface VocabularyItem {
  korean: string;
  english: string;
  grammarPattern?: string;
  exampleSentence?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
}

export interface GrammarPattern {
  pattern: string;
  explanation: string;
  examples: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export class GoogleDocsParser {
  private docs: any;
  private documentId: string;

  constructor() {
    // Initialize Google Docs API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/documents.readonly'],
    });

    this.docs = google.docs({ version: 'v1', auth });
    this.documentId = '1x0ZQkc4fNTKB8H-P_cYQQtv85GCNrytfENizgmC3peQ';
  }

  async parseDocument(): Promise<{
    vocabulary: VocabularyItem[];
    grammar: GrammarPattern[];
  }> {
    try {
      console.log('📖 Fetching Google Doc content...');
      const response = await this.docs.documents.get({
        documentId: this.documentId,
      });

      const content = this.extractTextFromDocument(response.data);
      console.log('📄 Document content extracted, length:', content.length);

      const vocabulary = this.parseVocabulary(content);
      const grammar = this.parseGrammar(content);

      console.log(`📚 Parsed ${vocabulary.length} vocabulary items and ${grammar.length} grammar patterns`);

      return { vocabulary, grammar };
    } catch (error) {
      console.error('Error parsing Google Doc:', error);
      throw error;
    }
  }

  private extractTextFromDocument(document: any): string {
    let text = '';
    
    const extractTextFromElement = (element: any): void => {
      if (element.textRun) {
        text += element.textRun.content || '';
      }
      if (element.table) {
        element.table.tableRows.forEach((row: any) => {
          row.tableCells.forEach((cell: any) => {
            cell.content.forEach(extractTextFromElement);
          });
        });
      }
      if (element.paragraph) {
        element.paragraph.elements.forEach(extractTextFromElement);
      }
    };

    document.body.content.forEach(extractTextFromElement);
    return text;
  }

  private parseVocabulary(content: string): VocabularyItem[] {
    const vocabulary: VocabularyItem[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Look for Korean-English pairs
      const koreanMatch = trimmedLine.match(/^([가-힣\s]+)\s*[-–—]\s*(.+)$/);
      if (koreanMatch) {
        const [, korean, english] = koreanMatch;
        vocabulary.push({
          korean: korean.trim(),
          english: english.trim(),
          difficulty: this.determineDifficulty(korean, english),
          category: this.categorizeWord(korean, english)
        });
      }

      // Look for grammar patterns with examples
      const grammarMatch = trimmedLine.match(/^([가-힣\s()]+)\s*[-–—]\s*(.+)$/);
      if (grammarMatch && trimmedLine.includes('(') && trimmedLine.includes(')')) {
        const [, pattern, explanation] = grammarMatch;
        vocabulary.push({
          korean: pattern.trim(),
          english: explanation.trim(),
          grammarPattern: pattern.trim(),
          difficulty: this.determineDifficulty(pattern, explanation),
          category: 'grammar'
        });
      }
    }

    return vocabulary;
  }

  private parseGrammar(content: string): GrammarPattern[] {
    const grammar: GrammarPattern[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Look for grammar patterns
      const grammarMatch = trimmedLine.match(/^([가-힣\s()]+)\s*[-–—]\s*(.+)$/);
      if (grammarMatch && trimmedLine.includes('(') && trimmedLine.includes(')')) {
        const [, pattern, explanation] = grammarMatch;
        
        // Look for examples in the next few lines
        const examples: string[] = [];
        const currentIndex = lines.indexOf(line);
        for (let i = currentIndex + 1; i < Math.min(currentIndex + 4, lines.length); i++) {
          const nextLine = lines[i].trim();
          if (nextLine && nextLine.match(/^[가-힣]/) && nextLine.length > 5) {
            examples.push(nextLine);
          }
        }

        grammar.push({
          pattern: pattern.trim(),
          explanation: explanation.trim(),
          examples,
          difficulty: this.determineDifficulty(pattern, explanation)
        });
      }
    }

    return grammar;
  }

  private determineDifficulty(korean: string, english: string): 'beginner' | 'intermediate' | 'advanced' {
    const koreanLength = korean.length;
    const englishLength = english.length;
    
    // Simple heuristics for difficulty
    if (koreanLength <= 3 || english.includes('basic') || english.includes('simple')) {
      return 'beginner';
    } else if (koreanLength > 6 || english.includes('advanced') || english.includes('complex')) {
      return 'advanced';
    } else {
      return 'intermediate';
    }
  }

  private categorizeWord(korean: string, english: string): string {
    const englishLower = english.toLowerCase();
    
    if (englishLower.includes('food') || englishLower.includes('eat') || englishLower.includes('drink')) {
      return 'food';
    } else if (englishLower.includes('time') || englishLower.includes('day') || englishLower.includes('week')) {
      return 'time';
    } else if (englishLower.includes('family') || englishLower.includes('friend') || englishLower.includes('person')) {
      return 'people';
    } else if (englishLower.includes('place') || englishLower.includes('location') || englishLower.includes('where')) {
      return 'places';
    } else if (englishLower.includes('feeling') || englishLower.includes('emotion') || englishLower.includes('happy')) {
      return 'emotions';
    } else {
      return 'general';
    }
  }

  // Fallback method for when Google Docs API is not available
  async parseFallbackContent(): Promise<{
    vocabulary: VocabularyItem[];
    grammar: GrammarPattern[];
  }> {
    // This would be called if Google Docs API fails
    // You could implement parsing from a local file or manual data entry
    console.log('⚠️ Using fallback vocabulary data');
    
    const vocabulary: VocabularyItem[] = [
      { korean: '안녕하세요', english: 'hello', difficulty: 'beginner', category: 'greetings' },
      { korean: '감사합니다', english: 'thank you', difficulty: 'beginner', category: 'greetings' },
      { korean: '죄송합니다', english: 'sorry', difficulty: 'beginner', category: 'greetings' },
      { korean: '맛있어요', english: 'delicious', difficulty: 'intermediate', category: 'food' },
      { korean: '재미있어요', english: 'fun/interesting', difficulty: 'intermediate', category: 'general' },
      { korean: '어려워요', english: 'difficult', difficulty: 'intermediate', category: 'general' },
      { korean: '시간이 있어요', english: 'have time', difficulty: 'intermediate', category: 'time' },
      { korean: '친구를 만나요', english: 'meet friends', difficulty: 'intermediate', category: 'people' },
    ];

    const grammar: GrammarPattern[] = [
      {
        pattern: 'V-(으)ㄹ 만하다',
        explanation: 'worth doing / worth the effort',
        examples: ['먹을 만해요', '볼 만해요', '할 만해요'],
        difficulty: 'intermediate'
      },
      {
        pattern: 'V-고 싶으면',
        explanation: 'if you want to do',
        examples: ['먹고 싶으면', '가고 싶으면', '하고 싶으면'],
        difficulty: 'intermediate'
      },
      {
        pattern: 'V-(으)ㄹ까요?',
        explanation: 'shall we do? / shall I do?',
        examples: ['먹을까요?', '갈까요?', '할까요?'],
        difficulty: 'beginner'
      }
    ];

    return { vocabulary, grammar };
  }
}




