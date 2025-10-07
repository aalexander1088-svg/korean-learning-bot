import express from 'express';
import * as http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import OpenAI from 'openai';
import { KoreanDatabase } from './database';
import { GoogleDocsParser, VocabularyItem, GrammarPattern } from './google-docs-parser';
import * as dotenv from 'dotenv';

dotenv.config();

export interface ConversationSession {
  id: string;
  userId: string;
  startTime: Date;
  messages: ChatMessage[];
  practiceMode: 'free' | 'targeted' | 'scenario';
  currentTopic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  vocabularyUsed: string[];
  grammarPracticed: string[];
  currentFocus?: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  koreanText?: string;
  corrections?: string[];
  suggestions?: string[];
  vocabularyHighlighted?: string[];
}

export interface PracticeScenario {
  name: string;
  description: string;
  vocabulary: string[];
  grammarPatterns: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export class KoreanConversationAgent {
  private app: express.Application;
  private server: http.Server;
  private io: SocketIOServer;
  private openai: OpenAI;
  private database: KoreanDatabase;
  private docsParser: GoogleDocsParser;
  private activeSessions: Map<string, ConversationSession>;
  private userVocabulary: VocabularyItem[];
  private userGrammar: GrammarPattern[];
  
  private scenarios: PracticeScenario[] = [
    {
      name: 'restaurant',
      description: 'Ordering food at a restaurant',
      vocabulary: ['맛있어요', '주문하다', '메뉴', '음식', '음료'],
      grammarPatterns: ['V-(으)ㄹ래요', 'V-고 싶어요'],
      difficulty: 'beginner'
    },
    {
      name: 'shopping',
      description: 'Shopping for clothes',
      vocabulary: ['사다', '비싸요', '싸요', '크다', '작다'],
      grammarPatterns: ['V-(으)ㄴ 것 같아요', 'V-지 않아요'],
      difficulty: 'intermediate'
    },
    {
      name: 'meeting_friends',
      description: 'Meeting friends and making plans',
      vocabulary: ['만나다', '시간', '약속', '계획', '일정'],
      grammarPatterns: ['V-(으)ㄹ까요?', 'V-고 싶어요'],
      difficulty: 'intermediate'
    }
  ];

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
    this.docsParser = new GoogleDocsParser();
    this.activeSessions = new Map();
    this.userVocabulary = [];
    this.userGrammar = [];
    
    this.initializeVocabulary();
    this.setupRoutes();
    this.setupSocketHandlers();
  }

  private async initializeVocabulary(): Promise<void> {
    try {
      console.log('🔄 Initializing vocabulary from Google Docs...');
      const { vocabulary, grammar } = await this.docsParser.parseDocument();
      this.userVocabulary = vocabulary;
      this.userGrammar = grammar;
      console.log(`✅ Loaded ${vocabulary.length} vocabulary items and ${grammar.length} grammar patterns`);
    } catch (error) {
      console.log('⚠️ Google Docs parsing failed, using fallback data...');
      const { vocabulary, grammar } = await this.docsParser.parseFallbackContent();
      this.userVocabulary = vocabulary;
      this.userGrammar = grammar;
    }
  }

  private setupRoutes(): void {
    this.app.use(express.json());
    this.app.use(express.static('public'));

    this.app.get('/', (req, res) => {
      res.send(this.generateChatInterface());
    });
  }

  private generateChatInterface(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Korean Conversation Practice Agent</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f7fa; }
          
          .container { display: flex; height: 100vh; }
          
          .sidebar { width: 300px; background: white; border-right: 1px solid #e1e5e9; overflow-y: auto; }
          .sidebar-header { padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
          .sidebar-content { padding: 20px; }
          
          .chat-area { flex: 1; display: flex; flex-direction: column; }
          .chat-header { background: white; padding: 20px; border-bottom: 1px solid #e1e5e9; }
          .chat-container { flex: 1; overflow-y: auto; padding: 20px; }
          .chat-input { background: white; padding: 20px; border-top: 1px solid #e1e5e9; }
          
          .message { margin: 10px 0; padding: 15px; border-radius: 15px; max-width: 70%; }
          .user-message { background: #667eea; color: white; margin-left: auto; }
          .agent-message { background: #f8f9fa; border: 1px solid #e1e5e9; }
          .system-message { background: #fff3cd; border: 1px solid #ffeaa7; text-align: center; font-style: italic; }
          
          .input-container { display: flex; gap: 10px; }
          .input-field { flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 25px; font-size: 16px; }
          .send-button { padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 25px; cursor: pointer; }
          
          .controls { display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap; }
          .control-btn { padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 20px; cursor: pointer; font-size: 14px; }
          .control-btn.active { background: #667eea; color: white; }
          
          .vocab-item { padding: 8px 12px; margin: 5px 0; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #667eea; }
          .vocab-korean { font-weight: bold; color: #2c3e50; }
          .vocab-english { color: #7f8c8d; font-size: 14px; }
          
          .grammar-pattern { padding: 10px; margin: 5px 0; background: #e8f5e8; border-radius: 8px; }
          .grammar-name { font-weight: bold; color: #27ae60; }
          .grammar-explanation { color: #7f8c8d; font-size: 14px; }
          
          .correction { background: #ffebee; padding: 8px; margin: 5px 0; border-radius: 5px; border-left: 3px solid #f44336; }
          .suggestion { background: #e8f5e8; padding: 8px; margin: 5px 0; border-radius: 5px; border-left: 3px solid #4caf50; }
          
          .progress-bar { width: 100%; height: 6px; background: #e1e5e9; border-radius: 3px; margin: 10px 0; }
          .progress-fill { height: 100%; background: #667eea; border-radius: 3px; transition: width 0.3s ease; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="sidebar">
            <div class="sidebar-header">
              <h2>🗣️ Korean Tutor</h2>
              <p>Your vocabulary & progress</p>
            </div>
            <div class="sidebar-content">
              <div class="controls">
                <button class="control-btn" onclick="setPracticeMode('free')">Free Chat</button>
                <button class="control-btn" onclick="setPracticeMode('targeted')">Targeted</button>
                <button class="control-btn" onclick="setPracticeMode('scenario')">Scenarios</button>
              </div>
              
              <h3>📚 Vocabulary</h3>
              <div id="vocabularyList">
                <!-- Vocabulary will be populated here -->
              </div>
              
              <h3>📖 Grammar Patterns</h3>
              <div id="grammarList">
                <!-- Grammar patterns will be populated here -->
              </div>
              
              <h3>📊 Progress</h3>
              <div class="progress-bar">
                <div class="progress-fill" id="progressFill" style="width: 0%"></div>
              </div>
              <div id="progressText">0% complete</div>
            </div>
          </div>
          
          <div class="chat-area">
            <div class="chat-header">
              <h1>Korean Conversation Practice</h1>
              <p>Practice Korean with your AI tutor! Type in Korean or English.</p>
            </div>
            
            <div class="chat-container" id="chatContainer">
              <div class="agent-message">
                안녕하세요! 👋 I'm your Korean conversation practice partner!<br><br>
                <strong>💡 How to practice:</strong><br>
                • Type in Korean or English - I'll respond naturally<br>
                • I'll use vocabulary from your personal list<br>
                • I'll gently correct mistakes and explain grammar<br>
                • Choose different practice modes on the left<br><br>
                <strong>오늘은 어떤 이야기를 하고 싶어요?</strong> (What would you like to talk about today?)
              </div>
            </div>
            
            <div class="chat-input">
              <div class="controls">
                <button class="control-btn" onclick="requestVocabularyTest()">📚 Test Words</button>
                <button class="control-btn" onclick="requestGrammarPractice()">📖 Practice Grammar</button>
                <button class="control-btn" onclick="requestScenario()">🎭 Start Scenario</button>
                <button class="control-btn" onclick="showProgress()">📊 Show Progress</button>
              </div>
              <div class="input-container">
                <input type="text" id="messageInput" class="input-field" placeholder="Type your message in Korean or English..." onkeypress="handleKeyPress(event)">
                <button onclick="sendMessage()" class="send-button">Send</button>
              </div>
            </div>
          </div>
        </div>

        <script src="/socket.io/socket.io.js"></script>
        <script>
          const socket = io();
          const chatContainer = document.getElementById('chatContainer');
          const messageInput = document.getElementById('messageInput');
          let currentPracticeMode = 'free';

          function addMessage(type, content, corrections = [], suggestions = [], vocabularyHighlighted = []) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ' + type + '-message';
            
            let html = '<div>' + content + '</div>';
            
            if (corrections.length > 0) {
              html += '<div style="margin-top: 10px;"><strong>📝 Corrections:</strong>';
              corrections.forEach(correction => {
                html += '<div class="correction">• ' + correction + '</div>';
              });
              html += '</div>';
            }
            
            if (suggestions.length > 0) {
              html += '<div style="margin-top: 10px;"><strong>💡 Suggestions:</strong>';
              suggestions.forEach(suggestion => {
                html += '<div class="suggestion">• ' + suggestion + '</div>';
              });
              html += '</div>';
            }
            
            if (vocabularyHighlighted.length > 0) {
              html += '<div style="margin-top: 10px;"><strong>📚 Vocabulary:</strong>';
              vocabularyHighlighted.forEach(word => {
                html += '<span style="background: #fff3cd; padding: 2px 6px; border-radius: 3px; margin: 0 2px;">' + word + '</span>';
              });
              html += '</div>';
            }
            
            messageDiv.innerHTML = html;
            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
          }

          function sendMessage() {
            const message = messageInput.value.trim();
            if (message) {
              addMessage('user', message);
              socket.emit('chatMessage', {
                message,
                practiceMode: currentPracticeMode
              });
              messageInput.value = '';
            }
          }

          function handleKeyPress(event) {
            if (event.key === 'Enter') {
              sendMessage();
            }
          }

          function setPracticeMode(mode) {
            currentPracticeMode = mode;
            document.querySelectorAll('.control-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            
            socket.emit('setPracticeMode', { mode });
            addMessage('system', 'Practice mode changed to: ' + mode);
          }

          function requestVocabularyTest() {
            socket.emit('requestVocabularyTest');
            addMessage('system', 'Testing your vocabulary...');
          }

          function requestGrammarPractice() {
            socket.emit('requestGrammarPractice');
            addMessage('system', 'Starting grammar practice...');
          }

          function requestScenario() {
            socket.emit('requestScenario');
            addMessage('system', 'Starting scenario practice...');
          }

          function showProgress() {
            socket.emit('showProgress');
          }

          function updateVocabularyList(vocabulary) {
            const container = document.getElementById('vocabularyList');
            container.innerHTML = '';
            vocabulary.forEach(word => {
              const div = document.createElement('div');
              div.className = 'vocab-item';
              div.innerHTML = '<div class="vocab-korean">' + word.korean + '</div><div class="vocab-english">' + word.english + '</div>';
              container.appendChild(div);
            });
          }

          function updateGrammarList(grammar) {
            const container = document.getElementById('grammarList');
            container.innerHTML = '';
            grammar.forEach(pattern => {
              const div = document.createElement('div');
              div.className = 'grammar-pattern';
              div.innerHTML = '<div class="grammar-name">' + pattern.pattern + '</div><div class="grammar-explanation">' + pattern.explanation + '</div>';
              container.appendChild(div);
            });
          }

          function updateProgress(percentage) {
            document.getElementById('progressFill').style.width = percentage + '%';
            document.getElementById('progressText').textContent = percentage + '% complete';
          }

          socket.on('agentResponse', (data) => {
            addMessage('agent', data.response, data.corrections || [], data.suggestions || [], data.vocabularyHighlighted || []);
          });

          socket.on('vocabularyUpdate', (data) => {
            updateVocabularyList(data.vocabulary);
          });

          socket.on('grammarUpdate', (data) => {
            updateGrammarList(data.grammar);
          });

          socket.on('progressUpdate', (data) => {
            updateProgress(data.percentage);
          });

          socket.on('error', (error) => {
            addMessage('system', 'Error: ' + error);
          });

          socket.emit('getInitialData');
        </script>
      </body>
      </html>
    `;
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log('👤 User connected to Korean conversation agent');

      const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const session: ConversationSession = {
        id: sessionId,
        userId: socket.id,
        startTime: new Date(),
        messages: [],
        practiceMode: 'free',
        currentTopic: 'general',
        difficulty: 'intermediate',
        vocabularyUsed: [],
        grammarPracticed: []
      };
      
      this.activeSessions.set(sessionId, session);

      socket.on('getInitialData', async () => {
        try {
          socket.emit('vocabularyUpdate', { vocabulary: this.userVocabulary });
          socket.emit('grammarUpdate', { grammar: this.userGrammar });
          socket.emit('progressUpdate', { percentage: 0 });
        } catch (error) {
          console.error('Error sending initial data:', error);
        }
      });

      socket.on('chatMessage', async (data) => {
        try {
          await this.handleChatMessage(socket, sessionId, data);
        } catch (error) {
          console.error('Error handling chat message:', error);
          socket.emit('error', 'Sorry, there was an error processing your message.');
        }
      });

      socket.on('setPracticeMode', (data) => {
        const session = this.activeSessions.get(sessionId);
        if (session) {
          session.practiceMode = data.mode;
        }
      });

      socket.on('requestVocabularyTest', async () => {
        try {
          await this.handleVocabularyTest(socket, sessionId);
        } catch (error) {
          console.error('Error handling vocabulary test:', error);
          socket.emit('error', 'Error generating vocabulary test.');
        }
      });

      socket.on('requestGrammarPractice', async () => {
        try {
          await this.handleGrammarPractice(socket, sessionId);
        } catch (error) {
          console.error('Error handling grammar practice:', error);
          socket.emit('error', 'Error starting grammar practice.');
        }
      });

      socket.on('requestScenario', async () => {
        try {
          await this.handleScenarioStart(socket, sessionId);
        } catch (error) {
          console.error('Error handling scenario request:', error);
          socket.emit('error', 'Error starting scenario.');
        }
      });

      socket.on('showProgress', async () => {
        try {
          await this.handleProgressRequest(socket, sessionId);
        } catch (error) {
          console.error('Error handling progress request:', error);
          socket.emit('error', 'Error getting progress.');
        }
      });

      socket.on('disconnect', () => {
        console.log('👤 User disconnected from Korean conversation agent');
        this.activeSessions.delete(sessionId);
      });
    });
  }

  private async handleChatMessage(socket: any, sessionId: string, data: any): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const userMessage: ChatMessage = {
      id: 'msg_' + Date.now(),
      type: 'user',
      content: data.message,
      timestamp: new Date()
    };
    session.messages.push(userMessage);

    const analysis = await this.analyzeUserInput(data.message);
    
    let response = '';
    let vocabularyHighlighted: string[] = [];
    
    switch (session.practiceMode) {
      case 'free':
        response = await this.generateFreeConversationResponse(data.message, session);
        break;
      case 'targeted':
        response = await this.generateTargetedPracticeResponse(data.message, session);
        break;
      case 'scenario':
        response = await this.generateScenarioResponse(data.message, session);
        break;
    }

    vocabularyHighlighted = this.extractVocabularyFromResponse(response);

    const agentMessage: ChatMessage = {
      id: 'msg_' + Date.now(),
      type: 'agent',
      content: response,
      timestamp: new Date(),
      corrections: analysis.corrections,
      suggestions: analysis.suggestions,
      vocabularyHighlighted
    };
    session.messages.push(agentMessage);

    this.updateVocabularyTracking(session, data.message, vocabularyHighlighted);

    socket.emit('agentResponse', {
      response,
      corrections: analysis.corrections,
      suggestions: analysis.suggestions,
      vocabularyHighlighted
    });
  }

  private async analyzeUserInput(input: string): Promise<{
    corrections: string[];
    suggestions: string[];
  }> {
    try {
      const prompt = `
You are a helpful Korean language tutor. Analyze this user input for mistakes and provide gentle corrections.

User input: "${input}"

If there are Korean grammar mistakes, provide:
1. Gentle correction pointing out the error
2. Explanation of the correct form
3. Encouragement

If the input is perfect, provide:
1. Positive reinforcement
2. Suggestion for more advanced usage

Respond in JSON format:
{
  "corrections": ["specific corrections if any"],
  "suggestions": ["helpful suggestions for improvement"]
}

Be encouraging and supportive. Focus on learning, not perfection.
`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a supportive Korean language tutor. Always respond in valid JSON format only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 200,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        return { corrections: [], suggestions: ['Keep practicing!'] };
      }

      try {
        const parsed = JSON.parse(responseText);
        return {
          corrections: parsed.corrections || [],
          suggestions: parsed.suggestions || []
        };
      } catch (parseError) {
        return { corrections: [], suggestions: ['Keep practicing!'] };
      }
    } catch (error) {
      console.error('Error analyzing user input:', error);
      return { corrections: [], suggestions: ['Keep practicing!'] };
    }
  }

  private async generateFreeConversationResponse(userInput: string, session: ConversationSession): Promise<string> {
    try {
      const recentVocab = this.userVocabulary.slice(0, 10).map(v => v.korean + ' (' + v.english + ')').join(', ');
      const recentGrammar = this.userGrammar.slice(0, 5).map(g => g.pattern + ' (' + g.explanation + ')').join(', ');

      const prompt = `
You are a friendly Korean conversation partner and tutor. The user said: "${userInput}"

IMPORTANT: Use vocabulary from their personal list naturally:
- Available vocabulary: ${recentVocab}
- Available grammar: ${recentGrammar}

Guidelines:
1. Respond in Korean (mix with English when helpful)
2. Use their vocabulary naturally in conversation
3. Ask follow-up questions that encourage them to use their words
4. Be encouraging and educational
5. Keep responses conversational, not textbook-like
6. Occasionally introduce new vocabulary from their list

Respond naturally and conversationally.
`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a friendly Korean conversation partner. Use the user\'s vocabulary naturally. Mix Korean and English appropriately. Be conversational and encouraging.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 150,
      });

      const response = completion.choices[0]?.message?.content;
      return response || '정말요? 더 자세히 말해주세요!';
    } catch (error) {
      console.error('Error generating conversation response:', error);
      return '죄송해요, 다시 말해주세요.';
    }
  }

  private async generateTargetedPracticeResponse(userInput: string, session: ConversationSession): Promise<string> {
    try {
      const targetGrammar = this.userGrammar[Math.floor(Math.random() * this.userGrammar.length)];
      
      const prompt = `
You are a Korean tutor focusing on grammar practice. The user said: "${userInput}"

Current focus: ${targetGrammar.pattern} - ${targetGrammar.explanation}

Your response should:
1. Acknowledge their input
2. Ask them to use the grammar pattern ${targetGrammar.pattern} in their response
3. Give them a specific situation or question that requires this pattern
4. Be encouraging and supportive

Examples of the pattern: ${targetGrammar.examples.join(', ')}

Respond in Korean with English hints when needed.
`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a Korean grammar tutor. Focus on specific grammar patterns. Be encouraging and provide clear examples.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 120,
      });

      const response = completion.choices[0]?.message?.content;
      session.currentFocus = targetGrammar.pattern;
      return response || targetGrammar.pattern + '를 사용해서 대답해보세요!';
    } catch (error) {
      console.error('Error generating targeted practice response:', error);
      return '문법 연습을 계속해봅시다!';
    }
  }

  private async generateScenarioResponse(userInput: string, session: ConversationSession): Promise<string> {
    try {
      const scenario = this.scenarios[Math.floor(Math.random() * this.scenarios.length)];
      
      const prompt = `
You are a Korean tutor running a role-play scenario. The user said: "${userInput}"

Current scenario: ${scenario.name} - ${scenario.description}
Scenario vocabulary: ${scenario.vocabulary.join(', ')}
Scenario grammar: ${scenario.grammarPatterns.join(', ')}

Your response should:
1. Stay in character for this scenario
2. Use vocabulary from the scenario list
3. Encourage them to use scenario-specific words and grammar
4. Move the scenario forward naturally

Respond in Korean, staying in character for the ${scenario.name} scenario.
`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a Korean tutor running role-play scenarios. Stay in character and use scenario-specific vocabulary.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 120,
      });

      const response = completion.choices[0]?.message?.content;
      session.currentTopic = scenario.name;
      return response || scenario.description + ' 상황에서 대화해봅시다!';
    } catch (error) {
      console.error('Error generating scenario response:', error);
      return '시나리오 연습을 계속해봅시다!';
    }
  }

  private extractVocabularyFromResponse(response: string): string[] {
    const highlighted: string[] = [];
    for (const vocab of this.userVocabulary) {
      if (response.includes(vocab.korean)) {
        highlighted.push(vocab.korean);
      }
    }
    return highlighted;
  }

  private updateVocabularyTracking(session: ConversationSession, userInput: string, agentVocabulary: string[]): void {
    const koreanWords = userInput.match(/[가-힣]+/g) || [];
    session.vocabularyUsed.push(...koreanWords);
    session.vocabularyUsed.push(...agentVocabulary);
    
    koreanWords.forEach(word => {
      this.database.incrementWordFrequency(word);
    });
  }

  private async handleVocabularyTest(socket: any, sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    try {
      const randomVocab = this.userVocabulary[Math.floor(Math.random() * this.userVocabulary.length)];
      
      const testTypes = [
        '📚 단어 테스트: "' + randomVocab.korean + '"의 뜻이 뭐예요?',
        '📚 문장 만들기: "' + randomVocab.korean + '" (' + randomVocab.english + ')를 사용해서 문장을 만들어보세요!',
        '📚 상황 연습: "' + randomVocab.korean + '"를 언제 사용하나요?'
      ];
      
      const randomTest = testTypes[Math.floor(Math.random() * testTypes.length)];
      
      socket.emit('agentResponse', {
        response: randomTest,
        corrections: [],
        suggestions: ['정답 힌트: ' + randomVocab.korean + ' = ' + randomVocab.english],
        vocabularyHighlighted: [randomVocab.korean]
      });

    } catch (error) {
      console.error('Error generating vocabulary test:', error);
      socket.emit('error', '단어 테스트를 생성할 수 없어요.');
    }
  }

  private async handleGrammarPractice(socket: any, sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    try {
      const randomGrammar = this.userGrammar[Math.floor(Math.random() * this.userGrammar.length)];
      
      const response = '📖 문법 연습: ' + randomGrammar.pattern + '\n\n설명: ' + randomGrammar.explanation + '\n\n예시: ' + randomGrammar.examples.join(', ') + '\n\n이 문법을 사용해서 문장을 만들어보세요!';

      session.currentFocus = randomGrammar.pattern;
      session.grammarPracticed.push(randomGrammar.pattern);
      
      socket.emit('agentResponse', {
        response,
        corrections: [],
        suggestions: [randomGrammar.pattern + '를 사용해보세요!'],
        vocabularyHighlighted: []
      });

    } catch (error) {
      console.error('Error generating grammar practice:', error);
      socket.emit('error', '문법 연습을 생성할 수 없어요.');
    }
  }

  private async handleScenarioStart(socket: any, sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    try {
      const scenario = this.scenarios[Math.floor(Math.random() * this.scenarios.length)];
      
      const response = '🎭 시나리오 시작: ' + scenario.description + '\n\n사용할 단어들: ' + scenario.vocabulary.join(', ') + '\n사용할 문법: ' + scenario.grammarPatterns.join(', ') + '\n\n이 상황에서 자연스럽게 대화해봅시다! 먼저 인사해보세요.';

      session.currentTopic = scenario.name;
      session.practiceMode = 'scenario';
      
      socket.emit('agentResponse', {
        response,
        corrections: [],
        suggestions: [scenario.vocabulary[0] + '를 사용해서 시작해보세요!'],
        vocabularyHighlighted: scenario.vocabulary
      });

    } catch (error) {
      console.error('Error starting scenario:', error);
      socket.emit('error', '시나리오를 시작할 수 없어요.');
    }
  }

  private async handleProgressRequest(socket: any, sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    try {
      const totalVocab = this.userVocabulary.length;
      const usedVocab = new Set(session.vocabularyUsed).size;
      const percentage = Math.round((usedVocab / totalVocab) * 100);
      
      const response = '📊 학습 진행 상황:\n\n• 총 단어: ' + totalVocab + '개\n• 사용한 단어: ' + usedVocab + '개\n• 진행률: ' + percentage + '%\n• 연습한 문법: ' + session.grammarPracticed.length + '개\n• 대화 모드: ' + session.practiceMode + '\n• 현재 주제: ' + session.currentTopic + '\n\n화이팅! 계속 공부하세요! 💪';

      socket.emit('agentResponse', {
        response,
        corrections: [],
        suggestions: [],
        vocabularyHighlighted: []
      });

      socket.emit('progressUpdate', { percentage });

    } catch (error) {
      console.error('Error getting progress:', error);
      socket.emit('error', '진행 상황을 가져올 수 없어요.');
    }
  }

  async startServer(port: number = 3001): Promise<void> {
    this.server.listen(port, '0.0.0.0', () => {
      console.log('🚀 Korean Conversation Practice Agent running on http://localhost:' + port);
      console.log('🗣️ Ready for Korean conversation practice!');
      console.log('📱 Features: Vocabulary integration, grammar practice, scenario role-play');
    });
  }

  close(): void {
    this.server.close();
    this.database.close();
  }
}

// Start the Korean conversation agent
const koreanAgent = new KoreanConversationAgent();
koreanAgent.startServer(3001);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Stopping Korean Conversation Practice Agent...');
  koreanAgent.close();
  process.exit(0);
});





