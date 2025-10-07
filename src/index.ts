import * as fs from 'fs';
import * as path from 'path';
import * as pdfParse from 'pdf-parse';
import OpenAI from 'openai';
import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import { KoreanDatabase } from './database';

// Load environment variables
dotenv.config();

interface KoreanAnalysis {
  vocabulary: Array<{
    korean: string;
    english: string;
  }>;
  grammar: Array<{
    pattern: string;
    explanation: string;
    examples: string[];
  }>;
  practiceSentences: Array<{
    korean: string;
    english: string;
  }>;
  reviewWords: Array<{
    korean: string;
    english: string;
    reviewType: 'spaced_repetition' | 'essential' | 'previous_day';
  }>;
  quiz: Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }>;
}

export class KoreanLearningEmailScript {
  private openai: OpenAI;
  private transporter: nodemailer.Transporter | null = null;
  private database: KoreanDatabase;

  constructor() {
    // Initialize OpenAI
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.database = new KoreanDatabase();

    // Initialize email transporter
    this.initializeEmailTransporter();
  }

  private initializeEmailTransporter(): void {
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    if (!emailUser || !emailPassword) {
      throw new Error('EMAIL_USER and EMAIL_PASSWORD environment variables are required');
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });
  }

  public async extractTextFromPDF(pdfPath: string): Promise<string> {
    try {
      console.log(`📖 Reading PDF: ${pdfPath}`);
      
      if (!fs.existsSync(pdfPath)) {
        throw new Error(`PDF file not found: ${pdfPath}`);
      }

      const dataBuffer = fs.readFileSync(pdfPath);
      const data = await pdfParse.default(dataBuffer);
      
      console.log(`✅ Successfully extracted ${data.text.length} characters from PDF`);
      return data.text;
    } catch (error) {
      console.error('❌ Error extracting text from PDF:', error);
      throw error;
    }
  }

  public async analyzeKoreanContent(text: string): Promise<KoreanAnalysis> {
    try {
      console.log('🤖 Analyzing Korean content with AI...');

      // Get user's personal vocabulary for context
      const userVocabulary = await this.database.getAllVocabulary();
      
      // Filter out basic/common words that shouldn't be in vocabulary
      const basicWords = ['안녕하세요', '안녕', '오늘', '어제', '내일', '네', '아니요', '고마워요', '감사합니다', '죄송합니다', '미안해요', '사과', '물', '밥', '집', '학교', '친구', '가족', '엄마', '아빠'];
      
      const filteredVocabulary = userVocabulary.filter(word => 
        !basicWords.includes(word.korean) && 
        word.korean.length > 2 && // Filter out very short words
        !word.korean.match(/^[가-힣]{1,2}$/) // Filter out 1-2 character Korean words
      );
      
      const recentWords = filteredVocabulary
        .filter(word => {
          const wordDate = new Date(word.dateAdded);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return wordDate > weekAgo;
        })
        .slice(0, 10)
        .map(word => `${word.korean} (${word.english})`)
        .join(', ');

      const essentialWords = await this.database.getEssentialWords();
      const essentialWordsList = essentialWords
        .filter(word => !basicWords.includes(word.korean))
        .slice(0, 8)
        .map(word => `${word.korean} (${word.english})`)
        .join(', ');

      const reviewWords = await this.database.getWordsForSpacedRepetition(7);
      const reviewWordsList = reviewWords
        .filter(word => !basicWords.includes(word.korean))
        .slice(0, 6)
        .map(word => `${word.korean} (${word.english})`)
        .join(', ');

      const prompt = `
You are a Korean language learning assistant. Analyze the following Korean text from a student's class notes and create review exercises based on the ACTUAL content in the text.

IMPORTANT: Focus ONLY on the vocabulary and grammar patterns that appear in the provided text. Do not add content that is not present in the notes.

CRITICAL: Use CASUAL, SPOKEN Korean sentences throughout. Make sentences LONGER and more natural - like real conversations between friends.

USER'S PERSONAL VOCABULARY CONTEXT:
- Recent words (last week): ${recentWords}
- Essential words: ${essentialWordsList}
- Words for review: ${reviewWordsList}

Use these words naturally in practice sentences and quiz questions when relevant.

1. VOCABULARY: Extract ALL Korean words/phrases that appear in the text with:
   - Korean text (as it appears in the notes)
   - English translation
   - EXCLUDE basic words like: 안녕하세요, 오늘, 어제, 네, 아니요, 고마워요, 감사합니다, 사과, 물, 밥, 집, 학교, 친구, 가족, 엄마, 아빠
   - Only include words that are 3+ characters or are meaningful vocabulary words
   - MINIMUM REQUIREMENT: Extract at least 10 vocabulary words from the text
   - If there are fewer than 10 words in the text, include ALL available words
   - Look for compound words, phrases, and expressions that appear in the text

2. GRAMMAR: Identify grammar patterns that are actually used in the text with:
   - Grammar pattern name
   - Clear explanation
   - Examples from the original text (if possible) - use casual spoken Korean

3. PRACTICE SENTENCES: Create exactly the same number of sentences as vocabulary words, using each vocabulary word in order:
   - Sentence 1 MUST use the first vocabulary word from the list
   - Sentence 2 MUST use the second vocabulary word from the list
   - Continue this pattern for all vocabulary words
   - Use ONLY casual, everyday Korean that native speakers actually use
   - Make sentences sound natural and conversational, NOT textbook-like
   - Each sentence should feel like something a Korean person would actually say
   - Korean sentence (highlighting the target vocabulary word)
   - English translation

4. REVIEW WORDS: Include 5-8 words from the user's vocabulary database for spaced repetition:
   - Use words from the user's personal vocabulary list
   - Mix of essential/common words that need review
   - Words that haven't been reviewed recently
   - Korean word, English translation, and review type

5. QUIZ: Create 8 challenging multiple choice questions based on the actual content:
   - Questions about vocabulary or grammar from the notes
   - Include questions about user's personal vocabulary when relevant
   - Make questions more complex and thought-provoking
   - 4 answer options (A, B, C, D)
   - Correct answer letter
   - Brief explanation referencing the original content

Korean class notes to analyze:
${text}

Please respond in JSON format with this exact structure:
{
  "vocabulary": [
    {
      "korean": "한국어 단어",
      "english": "English translation"
    }
  ],
  "grammar": [
    {
      "pattern": "Grammar pattern name",
      "explanation": "Clear explanation",
      "examples": ["casual example 1", "casual example 2", "casual example 3"]
    }
  ],
  "practiceSentences": [
    {
      "korean": "Longer casual Korean sentence using the first vocabulary word naturally",
      "english": "English translation"
    }
  ],
  "reviewWords": [
    {
      "korean": "Korean word for review",
      "english": "English translation",
      "reviewType": "spaced_repetition"
    }
  ],
  "quiz": [
    {
      "question": "Challenging question about Korean vocabulary or grammar",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "A",
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}
`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a Korean language learning assistant analyzing class notes. Focus ONLY on vocabulary and grammar that appears in the provided text. Create review exercises based on the actual content, not random Korean content. Always respond with valid JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000, // Reduced from 4000 to save tokens
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No response from OpenAI');
      }

      console.log('✅ Successfully analyzed Korean content');
      
      // Parse JSON response
      try {
        const analysis = JSON.parse(responseText) as KoreanAnalysis;
        
        // Validate minimum vocabulary requirement
        if (analysis.vocabulary.length < 10) {
          console.log(`⚠️ Only found ${analysis.vocabulary.length} vocabulary words, but need at least 10. Attempting to extract more...`);
          
          // Try to extract more words from the text manually
          // Look for Korean characters, English words that might be Korean vocabulary, and mixed content
          const koreanWords = text.match(/[가-힣]{3,}/g) || [];
          const englishWords = text.match(/\b[a-zA-Z]{4,}\b/g) || [];
          const uniqueWords = [...new Set(koreanWords)];
          
          // Filter out basic words and add missing ones
          const basicWords = ['안녕하세요', '안녕', '오늘', '어제', '내일', '네', '아니요', '고마워요', '감사합니다', '죄송합니다', '미안해요', '사과', '물', '밥', '집', '학교', '친구', '가족', '엄마', '아빠'];
          const additionalWords = uniqueWords
            .filter(word => !basicWords.includes(word) && !analysis.vocabulary.some(v => v.korean === word))
            .slice(0, 10 - analysis.vocabulary.length);
          
          // Add additional words with basic translations
          additionalWords.forEach(word => {
            analysis.vocabulary.push({
              korean: word,
              english: `[Korean word: ${word}]`
            });
          });
          
          // If still not enough words, try to extract from English words that might be Korean vocabulary
          if (analysis.vocabulary.length < 10) {
            const potentialKoreanWords = englishWords
              .filter(word => !['bedroom', 'fridge', 'freezer', 'accommodation', 'relationship', 'personality', 'behavior', 'parasite', 'angel', 'devil', 'mountain', 'range', 'stair', 'indoor', 'outdoor', 'pool'].includes(word.toLowerCase()))
              .slice(0, 10 - analysis.vocabulary.length);
            
            potentialKoreanWords.forEach(word => {
              analysis.vocabulary.push({
                korean: word,
                english: `[English word: ${word}]`
              });
            });
          }
          
          console.log(`✅ Added ${additionalWords.length} additional vocabulary words`);
        }
        
        return analysis;
      } catch (parseError) {
        console.error('❌ Error parsing OpenAI response as JSON:', parseError);
        console.log('Raw response:', responseText);
        throw new Error('Invalid JSON response from OpenAI');
      }
    } catch (error) {
      console.error('❌ Error analyzing Korean content:', error);
      throw error;
    }
  }

  public generateHTMLEmail(analysis: KoreanAnalysis, pdfPath: string): string {
    const vocabularyRows = analysis.vocabulary.map(item => `
      <tr>
        <td><strong>${item.korean}</strong></td>
        <td>${item.english}</td>
      </tr>
    `).join('');

    const grammarSections = analysis.grammar.map(item => `
      <div class="grammar-item">
        <h4>${item.pattern}</h4>
        <p>${item.explanation}</p>
        <ul>
          ${item.examples.map(example => `<li>${example}</li>`).join('')}
        </ul>
      </div>
    `).join('');

    const practiceSentencesKorean = analysis.practiceSentences.map((item, index) => `
      <div class="practice-sentence">
        <h4>Sentence ${index + 1}</h4>
        <div class="korean-sentence">
          <strong>Korean:</strong> ${item.korean}
        </div>
      </div>
    `).join('');

    const practiceSentencesEnglish = analysis.practiceSentences.map((item, index) => `
      <div class="translation-item">
        <strong>Sentence ${index + 1}:</strong> ${item.english}
      </div>
    `).join('');

    const reviewWords = analysis.reviewWords.map((item, index) => `
      <div class="review-word">
        <h4>Review ${index + 1}</h4>
        <div class="korean-word">
          <strong>Korean:</strong> ${item.korean}
        </div>
        <div class="english-word">
          <strong>English:</strong> ${item.english}
        </div>
        <div class="review-type">
          <span class="review-badge ${item.reviewType}">${item.reviewType.replace('_', ' ')}</span>
        </div>
      </div>
    `).join('');

    const quizQuestions = analysis.quiz.map((item, index) => `
      <div class="quiz-question">
        <h4>Question ${index + 1}</h4>
        <p class="question-text">${item.question}</p>
        <div class="quiz-options">
          ${item.options.map((option, optIndex) => `
            <div class="option">${String.fromCharCode(65 + optIndex)}. ${option}</div>
          `).join('')}
        </div>
      </div>
    `).join('');

    const quizAnswers = analysis.quiz.map((item, index) => `
      <div class="quiz-answer">
        <strong>Question ${index + 1}:</strong> ${item.correctAnswer} - ${item.explanation}
      </div>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Korean Learning Practice</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            text-align: center;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        h2 {
            color: #34495e;
            margin-top: 30px;
            border-left: 4px solid #3498db;
            padding-left: 15px;
        }
        h3 {
            color: #2c3e50;
            margin-top: 25px;
        }
        h4 {
            color: #34495e;
            margin-top: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #3498db;
            color: white;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .difficulty {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.9em;
            font-weight: bold;
        }
        .difficulty.beginner {
            background-color: #d4edda;
            color: #155724;
        }
        .difficulty.intermediate {
            background-color: #fff3cd;
            color: #856404;
        }
        .difficulty.advanced {
            background-color: #f8d7da;
            color: #721c24;
        }
        .grammar-item {
            background-color: #f8f9fa;
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
            border-left: 4px solid #17a2b8;
        }
        .practice-sentence {
            background-color: #fff;
            border: 1px solid #e9ecef;
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
        }
        .sentence, .translation {
            margin: 10px 0;
        }
        .notes {
            margin-top: 10px;
            font-style: italic;
            color: #6c757d;
        }
        .korean-sentence {
            margin: 10px 0;
            font-size: 1.1em;
        }
        .translations-section {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .translation-item {
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .quiz-question {
            background-color: #fff;
            border: 1px solid #e9ecef;
            padding: 20px;
            margin: 15px 0;
            border-radius: 5px;
        }
        .question-text {
            font-weight: bold;
            margin-bottom: 15px;
        }
        .quiz-options {
            margin: 15px 0;
        }
        .option {
            margin: 8px 0;
            padding: 8px;
            background-color: #f8f9fa;
            border-radius: 3px;
        }
        .answers-section {
            background-color: #e8f5e8;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #28a745;
        }
        .quiz-answer {
            margin: 10px 0;
            padding: 8px 0;
        }
        .memory-tip {
            font-style: italic;
            color: #6f42c1;
            background-color: #f8f9fa;
            padding: 2px 6px;
            border-radius: 3px;
        }
        .exercise-item {
            background-color: #fff;
            border: 1px solid #e9ecef;
            padding: 20px;
            margin: 15px 0;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .exercise-text {
            font-size: 1.1em;
            margin: 15px 0;
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 5px;
        }
        .story-prompt {
            background-color: #e3f2fd;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
        }
        .vocabulary-list {
            background-color: #fff3e0;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
        }
        .sample-story {
            background-color: #f1f8e9;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
            border-left: 4px solid #4caf50;
        }
        .word-focus {
            font-size: 1.2em;
            font-weight: bold;
            color: #1976d2;
            margin: 10px 0;
        }
        .associations {
            background-color: #f3e5f5;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
        }
        .korean-text {
            font-size: 1.1em;
            margin: 10px 0;
            padding: 10px;
            background-color: #fff3e0;
            border-radius: 5px;
        }
        .english-text {
            margin: 10px 0;
            padding: 10px;
            background-color: #e8f5e8;
            border-radius: 5px;
        }
        .answer {
            background-color: #d4edda;
            color: #155724;
            padding: 8px 12px;
            border-radius: 4px;
            margin-top: 10px;
            font-weight: bold;
        }
        .review-word {
            background-color: #fff;
            border: 1px solid #e9ecef;
            padding: 20px;
            margin: 15px 0;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .korean-word {
            font-size: 1.2em;
            margin: 10px 0;
            padding: 10px;
            background-color: #fff3e0;
            border-radius: 5px;
        }
        .english-word {
            margin: 10px 0;
            padding: 10px;
            background-color: #e8f5e8;
            border-radius: 5px;
        }
        .review-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.9em;
            font-weight: bold;
        }
        .review-badge.spaced_repetition {
            background-color: #e3f2fd;
            color: #1976d2;
        }
        .review-badge.essential {
            background-color: #fff3e0;
            color: #f57c00;
        }
        .review-badge.previous_day {
            background-color: #f3e5f5;
            color: #7b1fa2;
        }
        .source-info {
            background-color: #e9ecef;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            text-align: center;
        }
        ul {
            margin: 10px 0;
        }
        li {
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🇰🇷 Korean Learning Practice</h1>
        
        <div class="source-info">
            <strong>Source:</strong> ${path.basename(pdfPath)}<br>
            <strong>Generated:</strong> ${new Date().toLocaleString()}
        </div>

        <h2>📚 Vocabulary</h2>
        <table>
            <thead>
                <tr>
                    <th>Korean</th>
                    <th>English</th>
                </tr>
            </thead>
            <tbody>
                ${vocabularyRows}
            </tbody>
        </table>

        <h2>📖 Grammar Patterns</h2>
        ${grammarSections}

        <h2>🗣️ Practice Sentences</h2>
        <p><em>Try to translate these Korean sentences into English:</em></p>
        ${practiceSentencesKorean}
        
        <h3>📝 English Translations</h3>
        <div class="translations-section">
            ${practiceSentencesEnglish}
        </div>

        <h2>🔄 Review Words</h2>
        <p><em>Practice these words from previous lessons:</em></p>
        ${reviewWords}

        <h2>🧠 Quiz</h2>
        <p><em>Test your knowledge with these challenging questions:</em></p>
        ${quizQuestions}
        
        <h3>📋 Quiz Answers</h3>
        <div class="answers-section">
            ${quizAnswers}
        </div>

        <div style="margin-top: 40px; text-align: center; color: #6c757d;">
            <p>Happy learning! 화이팅! 💪</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  public async sendEmail(htmlContent: string, recipientEmail: string, pdfPath: string): Promise<void> {
    try {
      console.log(`📧 Sending email to: ${recipientEmail}`);

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipientEmail,
        subject: `Korean Learning Practice - ${path.basename(pdfPath)}`,
        html: htmlContent,
      };

      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }
      await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully!');
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw error;
    }
  }

  async processPDF(pdfPath: string, recipientEmail: string): Promise<void> {
    try {
      console.log('🚀 Starting Korean learning email script...');
      console.log(`📄 PDF: ${pdfPath}`);
      console.log(`📧 Email: ${recipientEmail}`);

      // Step 1: Extract text from PDF
      const text = await this.extractTextFromPDF(pdfPath);

      // Step 2: Analyze Korean content with AI
      const analysis = await this.analyzeKoreanContent(text);

      // Step 2.5: Store new vocabulary in database
      if (analysis.vocabulary && analysis.vocabulary.length > 0) {
        console.log('💾 Storing new vocabulary in database...');
        await this.database.storeVocabulary(analysis.vocabulary);
        console.log(`✅ Stored ${analysis.vocabulary.length} new vocabulary words`);
      }

      // Step 3: Generate HTML email
      const htmlContent = this.generateHTMLEmail(analysis, pdfPath);

      // Step 4: Send email
      await this.sendEmail(htmlContent, recipientEmail, pdfPath);

      console.log('🎉 Korean learning email script completed successfully!');
    } catch (error) {
      console.error('💥 Script failed:', error);
      process.exit(1);
    }
  }
}

// Main execution
async function main(): Promise<void> {
  try {
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
      console.error('❌ Usage: npm start <pdf-path> [email]');
      console.error('   Example: npm start ./korean-text.pdf');
      console.error('   Example: npm start ./korean-text.pdf user@example.com');
      process.exit(1);
    }

    const pdfPath = args[0];
    const recipientEmail = args[1] || process.env.DEFAULT_EMAIL || 'aalexander1088@gmail.com';

    const script = new KoreanLearningEmailScript();
    await script.processPDF(pdfPath, recipientEmail);
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}
