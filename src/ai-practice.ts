import OpenAI from 'openai';
import { KoreanDatabase } from './database';
import * as readline from 'readline';
import * as dotenv from 'dotenv';

dotenv.config();

interface ConversationContext {
  userLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  currentTopic: string;
  vocabularyUsed: string[];
  mistakes: Array<{
    korean: string;
    correction: string;
    explanation: string;
  }>;
  sessionStart: Date;
}

export class KoreanConversationalAI {
  private openai: OpenAI;
  private database: KoreanDatabase;
  private rl: readline.Interface;
  private context: ConversationContext;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.database = new KoreanDatabase();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.context = {
      userLevel: 'Intermediate',
      currentTopic: 'daily_conversation',
      vocabularyUsed: [],
      mistakes: [],
      sessionStart: new Date()
    };
  }

  private async askQuestion(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  private async analyzeKoreanResponse(userInput: string): Promise<{
    isCorrect: boolean;
    corrections: string[];
    suggestions: string[];
    encouragement: string;
  }> {
    try {
      const prompt = `
You are a Korean language tutor. Analyze this Korean text from a student and provide feedback.

Student's Korean: "${userInput}"

Please analyze:
1. Grammar correctness
2. Naturalness of expression
3. Vocabulary usage
4. Cultural appropriateness

Respond in JSON format:
{
  "isCorrect": true/false,
  "corrections": ["specific corrections if any"],
  "suggestions": ["better ways to express this"],
  "encouragement": "positive feedback message"
}

Be encouraging and helpful. Focus on learning, not perfection.
`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a supportive Korean language tutor. Always be encouraging and helpful.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(responseText);
    } catch (error) {
      console.error('Error analyzing Korean response:', error);
      return {
        isCorrect: true,
        corrections: [],
        suggestions: [],
        encouragement: 'Great effort! Keep practicing!'
      };
    }
  }

  private async generateConversationPrompt(topic: string, userLevel: string): Promise<string> {
    const prompt = `
You are a friendly Korean conversation partner. Start a conversation about: ${topic}

User level: ${userLevel}

Guidelines:
- Use casual, natural Korean
- Ask engaging questions
- Keep responses appropriate for the user's level
- Be encouraging and supportive
- Use vocabulary that helps them learn

Start with a friendly greeting and an interesting question about ${topic}.

Respond in Korean only, keep it conversational and natural.
`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a friendly Korean conversation partner. Always respond in Korean.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 200,
    });

    return completion.choices[0]?.message?.content || '안녕하세요! 오늘 기분은 어때요?';
  }

  private async generateFollowUpResponse(userInput: string, context: ConversationContext): Promise<string> {
    const prompt = `
You are continuing a Korean conversation. The user just said: "${userInput}"

Conversation context:
- Topic: ${context.currentTopic}
- User level: ${context.userLevel}
- Previous vocabulary used: ${context.vocabularyUsed.join(', ')}

Respond naturally in Korean:
- Acknowledge what they said
- Ask a follow-up question
- Use some of the vocabulary they've been learning
- Keep it engaging and educational

Respond in Korean only, be natural and conversational.
`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a friendly Korean conversation partner. Always respond in Korean.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 200,
    });

    return completion.choices[0]?.message?.content || '정말요? 더 자세히 말해주세요!';
  }

  async startConversation(): Promise<void> {
    console.log('🗣️ Korean Conversational AI Practice');
    console.log('=====================================');
    console.log('Type "quit" to end the conversation');
    console.log('Type "help" for commands');
    console.log('');

    // Choose conversation topic
    const topics = [
      'daily_life', 'food', 'hobbies', 'travel', 'work', 'family', 'weather', 'shopping'
    ];
    
    console.log('Choose a conversation topic:');
    topics.forEach((topic, index) => {
      console.log(`${index + 1}. ${topic}`);
    });
    
    const topicChoice = await this.askQuestion('\nEnter topic number (1-8): ');
    const topicIndex = parseInt(topicChoice) - 1;
    this.context.currentTopic = topics[topicIndex] || 'daily_life';

    // Start conversation
    const openingMessage = await this.generateConversationPrompt(
      this.context.currentTopic, 
      this.context.userLevel
    );
    
    console.log(`\n🤖 AI: ${openingMessage}`);
    console.log('');

    // Conversation loop
    while (true) {
      const userInput = await this.askQuestion('You: ');
      
      if (userInput.toLowerCase() === 'quit') {
        break;
      }
      
      if (userInput.toLowerCase() === 'help') {
        console.log('\nCommands:');
        console.log('- quit: End conversation');
        console.log('- help: Show this help');
        console.log('- level: Change difficulty level');
        console.log('- topic: Change conversation topic');
        continue;
      }

      if (userInput.toLowerCase() === 'level') {
        const newLevel = await this.askQuestion('Enter level (Beginner/Intermediate/Advanced): ');
        this.context.userLevel = newLevel as 'Beginner' | 'Intermediate' | 'Advanced';
        console.log(`Level changed to: ${this.context.userLevel}`);
        continue;
      }

      if (userInput.toLowerCase() === 'topic') {
        console.log('Available topics:', topics.join(', '));
        const newTopic = await this.askQuestion('Enter new topic: ');
        this.context.currentTopic = newTopic;
        continue;
      }

      // Analyze user's Korean input
      const analysis = await this.analyzeKoreanResponse(userInput);
      
      // Show feedback
      if (!analysis.isCorrect && analysis.corrections.length > 0) {
        console.log(`\n📝 Corrections:`);
        analysis.corrections.forEach(correction => {
          console.log(`   • ${correction}`);
        });
      }
      
      if (analysis.suggestions.length > 0) {
        console.log(`\n💡 Suggestions:`);
        analysis.suggestions.forEach(suggestion => {
          console.log(`   • ${suggestion}`);
        });
      }
      
      console.log(`\n🌟 ${analysis.encouragement}`);
      
      // Generate AI response
      const aiResponse = await this.generateFollowUpResponse(userInput, this.context);
      console.log(`\n🤖 AI: ${aiResponse}`);
      console.log('');
      
      // Track vocabulary and mistakes
      this.context.vocabularyUsed.push(userInput);
      if (!analysis.isCorrect) {
        this.context.mistakes.push({
          korean: userInput,
          correction: analysis.corrections[0] || '',
          explanation: analysis.suggestions[0] || ''
        });
      }
    }

    // Session summary
    console.log('\n📊 Conversation Summary');
    console.log('======================');
    console.log(`Duration: ${Math.round((Date.now() - this.context.sessionStart.getTime()) / 1000 / 60)} minutes`);
    console.log(`Korean phrases used: ${this.context.vocabularyUsed.length}`);
    console.log(`Mistakes corrected: ${this.context.mistakes.length}`);
    
    if (this.context.mistakes.length > 0) {
      console.log('\n📝 Mistakes to review:');
      this.context.mistakes.forEach((mistake, index) => {
        console.log(`${index + 1}. "${mistake.korean}" → "${mistake.correction}"`);
      });
    }
    
    console.log('\n🎉 Great practice session! Keep learning Korean! 화이팅!');
    
    this.rl.close();
    this.database.close();
  }
}

// Start the conversational AI
const ai = new KoreanConversationalAI();
ai.startConversation().catch(console.error);
