import express from 'express';
import * as http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import OpenAI from 'openai';
import { KoreanDatabase } from './database';
import * as dotenv from 'dotenv';

dotenv.config();

class SimpleKoreanChat {
  private app: express.Application;
  private server: http.Server;
  private io: SocketIOServer;
  private openai: OpenAI;
  private database: KoreanDatabase;
  private lastKoreanMessage: string = '';

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.database = new KoreanDatabase();
    
    this.setupRoutes();
    this.setupSocketHandlers();
  }

  private setupRoutes(): void {
    this.app.use(express.json());

    this.app.get('/', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Simple Korean Chat</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
            .chat-container { height: 400px; overflow-y: auto; padding: 20px; border-bottom: 1px solid #eee; }
            .message { margin: 10px 0; padding: 10px; border-radius: 10px; }
            .user-message { background: #e3f2fd; margin-left: 20%; }
            .ai-message { background: #f3e5f5; margin-right: 20%; }
            .input-container { padding: 20px; display: flex; gap: 10px; }
            .input-field { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
            .send-button { padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; }
            .send-button:hover { background: #5a6fd8; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🗣️ Simple Korean Chat</h1>
              <p>Type a message and get a Korean response!</p>
            </div>
            <div class="chat-container" id="chatContainer">
              <div class="ai-message">
                안녕하세요! Ready to chat in Korean? Type a message below!
                <br><br>
                <strong>💡 Translation Commands:</strong><br>
                • <code>explain</code> - Analyze the last Korean sentence<br>
                • <code>translate</code> - Translate the last Korean sentence<br>
                • <code>breakdown</code> - Grammar breakdown of last sentence<br>
                <br>
                <strong>Or specify:</strong> <code>explain: 안녕하세요!</code>
              </div>
            </div>
            <div class="controls" style="padding: 10px 20px; background: #f8f9fa; border-top: 1px solid #eee;">
              <button onclick="testVocabulary()" style="background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-right: 10px;">📚 Test Words</button>
              <button onclick="practiceSentence()" style="background: #FF9800; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-right: 10px;">✍️ Make Sentence</button>
              <button onclick="showStats()" style="background: #2196F3; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">📊 My Stats</button>
            </div>
            <div class="input-container">
              <input type="text" id="messageInput" class="input-field" placeholder="Type your message here..." onkeypress="handleKeyPress(event)">
              <button onclick="sendMessage()" class="send-button">Send</button>
            </div>
          </div>

          <script src="/socket.io/socket.io.js"></script>
          <script>
            const socket = io();
            const chatContainer = document.getElementById('chatContainer');
            const messageInput = document.getElementById('messageInput');

            function addMessage(type, content) {
              const messageDiv = document.createElement('div');
              messageDiv.className = \`message \${type}-message\`;
              messageDiv.innerHTML = \`<div>\${content}</div>\`;
              chatContainer.appendChild(messageDiv);
              chatContainer.scrollTop = chatContainer.scrollHeight;
            }

            function sendMessage() {
              const message = messageInput.value.trim();
              if (message) {
                addMessage('user', message);
                socket.emit('chatMessage', { message: message });
                messageInput.value = '';
              }
            }

            function handleKeyPress(event) {
              if (event.key === 'Enter') {
                sendMessage();
              }
            }

            function testVocabulary() {
              socket.emit('testVocabulary');
            }

            function practiceSentence() {
              socket.emit('practiceSentence');
            }

            function showStats() {
              socket.emit('showStats');
            }

            socket.on('aiResponse', (data) => {
              addMessage('ai', data.response);
            });

            socket.on('error', (error) => {
              addMessage('ai', 'Error: ' + error);
            });
          </script>
        </body>
        </html>
      `);
    });
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log('👤 User connected to simple Korean chat');

      socket.on('chatMessage', async (data) => {
        try {
          console.log('📨 Received message:', data.message);
          
          // Check if user wants translation/breakdown
          const message = data.message.toLowerCase().trim();
          if (message === 'explain' || message === 'translate' || message === 'breakdown' ||
              message.startsWith('explain:') || message.startsWith('translate:') || message.startsWith('breakdown:')) {
            console.log('🔍 Last Korean message:', this.lastKoreanMessage);
            const response = await this.generateTranslationBreakdown(data.message, this.lastKoreanMessage);
            console.log('🔍 Sending translation breakdown:', response);
            socket.emit('aiResponse', { response: response });
            return;
          }
          
          // Generate Korean response with vocabulary integration
          const response = await this.generateKoreanResponse(data.message);
          
          // Store the Korean response for potential translation
          this.lastKoreanMessage = response;
          
          console.log('🤖 Sending response:', response);
          socket.emit('aiResponse', { response: response });
          
        } catch (error) {
          console.error('Error handling message:', error);
          socket.emit('error', 'Sorry, there was an error. Please try again.');
        }
      });

      socket.on('testVocabulary', async () => {
        try {
          console.log('📚 Testing vocabulary...');
          const testResponse = await this.generateVocabularyTest();
          socket.emit('aiResponse', { response: testResponse });
        } catch (error) {
          console.error('Error generating vocabulary test:', error);
          socket.emit('error', 'Error generating vocabulary test.');
        }
      });

      socket.on('practiceSentence', async () => {
        try {
          console.log('✍️ Practicing sentence making...');
          const practiceResponse = await this.generateSentencePractice();
          socket.emit('aiResponse', { response: practiceResponse });
        } catch (error) {
          console.error('Error generating sentence practice:', error);
          socket.emit('error', 'Error generating sentence practice.');
        }
      });

      socket.on('showStats', async () => {
        try {
          console.log('📊 Showing stats...');
          const statsResponse = await this.generateStats();
          socket.emit('aiResponse', { response: statsResponse });
        } catch (error) {
          console.error('Error generating stats:', error);
          socket.emit('error', 'Error generating stats.');
        }
      });

      socket.on('disconnect', () => {
        console.log('👤 User disconnected from simple Korean chat');
      });
    });
  }

  private async generateTranslationBreakdown(userInput: string, lastKoreanMessage?: string): Promise<string> {
    try {
      // Check if user just typed the command without text
      const command = userInput.toLowerCase().trim();
      let koreanText = '';
      
      console.log('🔍 Command:', command);
      console.log('🔍 Last Korean message received:', lastKoreanMessage);
      
      if (command === 'explain' || command === 'translate' || command === 'breakdown') {
        // Use the last Korean message from AI
        if (lastKoreanMessage && lastKoreanMessage.trim().length > 0) {
          koreanText = lastKoreanMessage;
          console.log('🔍 Using last Korean message:', koreanText);
        } else {
          console.log('🔍 No last Korean message available');
          return '🔍 분석할 한국어 문장이 없어요. 먼저 한국어로 대화해보세요!';
        }
      } else {
        // Extract the Korean text after the command
        koreanText = userInput.replace(/^(explain:|translate:|breakdown:)\s*/i, '').trim();
        
        if (!koreanText) {
          return '🔍 사용법: "explain" 또는 "explain: [한국어 문장]"을 입력하세요.\n\n예시: explain 또는 explain: 안녕하세요!';
        }
      }

      const prompt = `
You are a Korean language tutor. Break down this Korean sentence in detail:

Korean sentence: "${koreanText}"

Please provide:
1. English translation
2. Word-by-word breakdown with meanings
3. Grammar patterns used
4. Pronunciation tips (if helpful)
5. Usage examples

Format your response clearly with sections and bullet points.
Be educational and helpful for Korean learners.
`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful Korean language tutor. Provide detailed breakdowns of Korean sentences with translations, grammar explanations, and learning tips.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 300,
      });

      const response = completion.choices[0]?.message?.content;
      return `🔍 **문장 분석**\n\n${response}`;
    } catch (error) {
      console.error('Error generating translation breakdown:', error);
      return '번역 분석을 생성할 수 없어요. 다시 시도해주세요.';
    }
  }

  private async generateKoreanResponse(userInput: string): Promise<string> {
    try {
      // Get user's vocabulary for context
      const userVocabulary = await this.database.getAllVocabulary();
      const recentWords = userVocabulary
        .filter(word => {
          const wordDate = new Date(word.dateAdded);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return wordDate > weekAgo;
        })
        .slice(0, 8)
        .map(word => `${word.korean} (${word.english})`)
        .join(', ');

      const essentialWords = await this.database.getEssentialWords();
      const essentialWordsList = essentialWords
        .slice(0, 5)
        .map(word => `${word.korean} (${word.english})`)
        .join(', ');

      const prompt = `
You are a helpful Korean conversation partner and tutor. The user said: "${userInput}"

IMPORTANT: Use the user's actual vocabulary in your response:
- Recent words (last week): ${recentWords}
- Essential words: ${essentialWordsList}

Guidelines:
1. Respond in Korean only
2. Keep responses short (1-2 sentences)
3. Use their vocabulary naturally in conversation
4. Ask follow-up questions using their words
5. Be encouraging and educational
6. Don't repeat the same phrases
7. If they ask for different words, suggest specific words from their vocabulary

Examples of good responses:
- "예전에는 어떤 일을 하셨나요?" (using their word "예전에는")
- "현재는 어떤 일을 하고 계세요?" (using their word "현재")
- "드디어 한국어를 배우고 있네요!" (using their word "드디어")
`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful Korean conversation partner and tutor. Always respond in Korean. Use the user\'s vocabulary naturally. Be varied and educational.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7, // Higher temperature for more variety
        max_tokens: 80,
      });

      const response = completion.choices[0]?.message?.content;
      return response || '안녕하세요! 어떤 단어를 연습하고 싶으세요?';
    } catch (error) {
      console.error('Error generating Korean response:', error);
      return '죄송해요, 다시 말해주세요.';
    }
  }

  private async generateVocabularyTest(): Promise<string> {
    try {
      const reviewWords = await this.database.getWordsForSpacedRepetition(7);
      const essentialWords = await this.database.getEssentialWords();
      const testWords = [...reviewWords.slice(0, 2), ...essentialWords.slice(0, 2)];

      if (testWords.length === 0) {
        return '아직 테스트할 단어가 없어요. 먼저 단어를 배워보세요!';
      }

      const randomWord = testWords[Math.floor(Math.random() * testWords.length)];
      
      // Create different types of questions
      const questionTypes = [
        `📚 단어 테스트: "${randomWord.korean}"의 뜻이 뭐예요? (정답: ${randomWord.english})`,
        `📚 문장 만들기: "${randomWord.korean}" (${randomWord.english})를 사용해서 문장을 만들어보세요!`,
        `📚 반대말 찾기: "${randomWord.korean}"의 반대말을 생각해보세요!`,
        `📚 상황 연습: "${randomWord.korean}"를 언제 사용하나요?`
      ];
      
      const randomQuestion = questionTypes[Math.floor(Math.random() * questionTypes.length)];
      return randomQuestion;
    } catch (error) {
      console.error('Error generating vocabulary test:', error);
      return '단어 테스트를 생성할 수 없어요.';
    }
  }

  private async generateSentencePractice(): Promise<string> {
    try {
      const recentWords = await this.database.getAllVocabulary();
      const wordsForPractice = recentWords
        .filter(word => {
          const wordDate = new Date(word.dateAdded);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return wordDate > weekAgo;
        })
        .slice(0, 8);

      if (wordsForPractice.length === 0) {
        return '문장 연습할 단어가 없어요. 먼저 단어를 배워보세요!';
      }

      const randomWord = wordsForPractice[Math.floor(Math.random() * wordsForPractice.length)];
      
      // Create different practice scenarios
      const practiceTypes = [
        `✍️ 문장 연습: "${randomWord.korean}" (${randomWord.english})를 사용해서 문장을 만들어보세요!`,
        `✍️ 상황 연습: "${randomWord.korean}"를 사용해서 질문을 만들어보세요!`,
        `✍️ 대화 연습: "${randomWord.korean}"를 사용해서 친구와 대화해보세요!`,
        `✍️ 스토리 연습: "${randomWord.korean}"를 포함한 짧은 이야기를 만들어보세요!`
      ];
      
      const randomPractice = practiceTypes[Math.floor(Math.random() * practiceTypes.length)];
      return randomPractice;
    } catch (error) {
      console.error('Error generating sentence practice:', error);
      return '문장 연습을 생성할 수 없어요.';
    }
  }

  private async generateStats(): Promise<string> {
    try {
      const vocabulary = await this.database.getAllVocabulary();
      const grammar = await this.database.getAllGrammar();
      
      const totalWords = vocabulary.length;
      const totalGrammar = grammar.length;
      const reviewedWords = vocabulary.filter(word => word.reviewCount > 0).length;
      
      return `📊 학습 통계:
• 총 단어: ${totalWords}개
• 총 문법: ${totalGrammar}개  
• 복습한 단어: ${reviewedWords}개
• 복습률: ${totalWords > 0 ? Math.round((reviewedWords / totalWords) * 100) : 0}%

화이팅! 계속 공부하세요! 💪`;
    } catch (error) {
      console.error('Error generating stats:', error);
      return '통계를 생성할 수 없어요.';
    }
  }

  async startServer(port: number = 3000): Promise<void> {
    this.server.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Simple Korean Chat server running on http://localhost:${port}`);
      console.log('🗣️ Ready for Korean conversation!');
      console.log('📱 Mobile access: Check your computer\'s IP address and use http://[YOUR_IP]:3000');
    });
  }

  close(): void {
    this.server.close();
  }
}

// Start the simple chat server
const simpleChat = new SimpleKoreanChat();
simpleChat.startServer(3000);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Stopping Simple Korean Chat...');
  simpleChat.close();
  process.exit(0);
});
