import express from 'express';
import * as http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import OpenAI from 'openai';
import { KoreanDatabase } from './database';
import { IntelligentLearningSystem } from './intelligent-learning';
import * as dotenv from 'dotenv';

dotenv.config();

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  koreanText?: string;
  corrections?: string[];
  suggestions?: string[];
}

interface ChatSession {
  id: string;
  userId: string;
  startTime: Date;
  messages: ChatMessage[];
  topic: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  vocabularyUsed: string[];
}

export class KoreanChatCompanion {
  private app: express.Application;
  private server: http.Server;
  private io: SocketIOServer;
  private openai: OpenAI;
  private database: KoreanDatabase;
  private learningSystem: IntelligentLearningSystem;
  private activeSessions: Map<string, ChatSession>;

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
    this.learningSystem = new IntelligentLearningSystem();
    this.activeSessions = new Map();
    
    this.setupRoutes();
    this.setupSocketHandlers();
  }

  private setupRoutes(): void {
    this.app.use(express.json());
    this.app.use(express.static('public'));

    // Serve the chat interface
    this.app.get('/', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Korean AI Chat Companion</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
            .chat-container { height: 400px; overflow-y: auto; padding: 20px; border-bottom: 1px solid #eee; }
            .message { margin: 10px 0; padding: 10px; border-radius: 10px; }
            .user-message { background: #e3f2fd; margin-left: 20%; }
            .ai-message { background: #f3e5f5; margin-right: 20%; }
            .system-message { background: #fff3e0; text-align: center; font-style: italic; }
            .input-container { padding: 20px; display: flex; gap: 10px; }
            .input-field { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
            .send-button { padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; }
            .controls { padding: 10px 20px; background: #f8f9fa; border-top: 1px solid #eee; }
            .correction { background: #ffebee; padding: 5px; margin: 5px 0; border-radius: 3px; }
            .suggestion { background: #e8f5e8; padding: 5px; margin: 5px 0; border-radius: 3px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🗣️ Korean AI Chat Companion</h1>
              <p>Practice Korean conversation with AI! Type in Korean or English.</p>
            </div>
            <div class="chat-container" id="chatContainer">
              <div class="system-message">
                안녕하세요! Ready to practice Korean? Choose a topic and start chatting!
              </div>
            </div>
            <div class="controls">
              <button onclick="setTopic('daily_life')">Daily Life</button>
              <button onclick="setTopic('food')">Food</button>
              <button onclick="setTopic('hobbies')">Hobbies</button>
              <button onclick="setDifficulty('Beginner')">Beginner</button>
              <button onclick="setDifficulty('Intermediate')">Intermediate</button>
              <button onclick="setDifficulty('Advanced')">Advanced</button>
              <button onclick="testVocabulary()" style="background: #4CAF50;">📚 Test Words</button>
              <button onclick="practiceSentence()" style="background: #FF9800;">✍️ Make Sentence</button>
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
            let currentTopic = 'daily_life';
            let currentDifficulty = 'Intermediate';

            function addMessage(type, content, corrections = [], suggestions = [], audio = null) {
              const messageDiv = document.createElement('div');
              messageDiv.className = \`message \${type}-message\`;
              
              let html = \`<div>\${content}</div>\`;
              
              // Add click-to-speak for Korean text
              html = html.replace(/([가-힣]+)/g, '<span onclick="speakKorean(\'$1\')" style="cursor: pointer; background: #e3f2fd; padding: 2px 4px; border-radius: 3px; margin: 0 2px;" title="Click to speak">$1</span>');
              
              // Add audio player for AI messages with Korean content
              if (type === 'ai' && audio) {
                const audioId = 'audio_' + Date.now();
                html += \`<div style="margin-top: 10px;">
                  <button onclick="playAudio('\${audioId}')" style="background: #4CAF50; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                    🔊 Play Korean Audio
                  </button>
                  <audio id="\${audioId}" style="display: none;">
                    <source src="data:audio/mp3;base64,\${audio}" type="audio/mp3">
                  </audio>
                </div>\`;
              }
              
              if (corrections.length > 0) {
                html += '<div style="margin-top: 10px;"><strong>📝 Corrections:</strong>';
                corrections.forEach(correction => {
                  html += \`<div class="correction">• \${correction}</div>\`;
                });
                html += '</div>';
              }
              
              if (suggestions.length > 0) {
                html += '<div style="margin-top: 10px;"><strong>💡 Suggestions:</strong>';
                suggestions.forEach(suggestion => {
                  html += \`<div class="suggestion">• \${suggestion}</div>\`;
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
                try {
                  socket.emit('chatMessage', {
                    message,
                    topic: currentTopic,
                    difficulty: currentDifficulty
                  });
                  messageInput.value = '';
                } catch (error) {
                  console.error('Error sending message:', error);
                  addMessage('system', 'Error sending message. Please try again.');
                }
              }
            }

            function handleKeyPress(event) {
              if (event.key === 'Enter') {
                sendMessage();
              }
            }

            function setTopic(topic) {
              currentTopic = topic;
              addMessage('system', \`Topic changed to: \${topic}\`);
            }

            function setDifficulty(difficulty) {
              currentDifficulty = difficulty;
              addMessage('system', \`Difficulty set to: \${difficulty}\`);
            }

            function testVocabulary() {
              socket.emit('testVocabulary');
              addMessage('system', 'Testing your vocabulary...');
            }

            function practiceSentence() {
              socket.emit('makeSentence');
              addMessage('system', 'Practicing sentence making...');
            }

            function playAudio(audioId) {
              const audio = document.getElementById(audioId);
              if (audio) {
                audio.play().catch(e => console.log('Audio play failed:', e));
              }
            }

            function speakKorean(koreanText) {
              // Use Web Speech API as fallback for click-to-speak
              if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(koreanText);
                utterance.lang = 'ko-KR';
                utterance.rate = 0.8;
                utterance.pitch = 1;
                speechSynthesis.speak(utterance);
              } else {
                console.log('Speech synthesis not supported');
              }
            }

            socket.on('aiResponse', (data) => {
              addMessage('ai', data.response, data.corrections || [], data.suggestions || [], data.audio);
            });

            socket.on('error', (error) => {
              addMessage('system', \`Error: \${error}\`);
            });

            socket.on('connect_error', (error) => {
              addMessage('system', 'Connection error. Please refresh the page.');
            });

            socket.on('disconnect', () => {
              addMessage('system', 'Disconnected from server. Please refresh the page.');
            });
          </script>
        </body>
        </html>
      `);
    });
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log('👤 User connected to Korean chat');

      // Create new chat session
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const session: ChatSession = {
        id: sessionId,
        userId: socket.id,
        startTime: new Date(),
        messages: [],
        topic: 'daily_life',
        difficulty: 'Intermediate',
        vocabularyUsed: []
      };
      
      this.activeSessions.set(sessionId, session);

      socket.on('chatMessage', async (data) => {
        try {
          console.log('📨 Received message:', data.message);
          await this.handleChatMessage(socket, sessionId, data);
        } catch (error) {
          console.error('Error handling chat message:', error);
          socket.emit('error', 'Sorry, there was an error processing your message.');
        }
      });

      socket.on('testVocabulary', async () => {
        try {
          await this.handleVocabularyTest(socket, sessionId);
        } catch (error) {
          console.error('Error handling vocabulary test:', error);
          socket.emit('error', 'Sorry, there was an error with the vocabulary test.');
        }
      });

      socket.on('makeSentence', async (data) => {
        try {
          await this.handleSentencePractice(socket, sessionId, data);
        } catch (error) {
          console.error('Error handling sentence practice:', error);
          socket.emit('error', 'Sorry, there was an error with sentence practice.');
        }
      });

      socket.on('disconnect', () => {
        console.log('👤 User disconnected from Korean chat');
        this.activeSessions.delete(sessionId);
      });
    });
  }

  private async handleChatMessage(socket: any, sessionId: string, data: any): Promise<void> {
    console.log('🔄 Processing chat message...');
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      console.log('❌ No session found');
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      type: 'user',
      content: data.message,
      timestamp: new Date()
    };

    session.messages.push(userMessage);
    session.topic = data.topic;
    session.difficulty = data.difficulty;

    console.log('✅ User message stored, generating AI response...');

    // Skip Korean analysis for now to get basic chat working
    let analysis: { koreanText?: string; corrections: string[]; suggestions: string[] } = { 
      corrections: [], 
      suggestions: [] 
    };
    
    console.log('⏭️ Skipping Korean analysis for now');

    // Generate AI response
    let aiResponse = '안녕하세요! 어떻게 도와드릴까요?';
    try {
      // Simple response for now
      aiResponse = await this.generateSimpleAIResponse(data.message);
    } catch (error) {
      console.error('Error generating AI response:', error);
      // Use fallback response
    }
    
    const aiMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      type: 'ai',
      content: aiResponse,
      timestamp: new Date()
    };

    session.messages.push(aiMessage);

    // Generate audio for Korean response
    let audioBuffer: Buffer | null = null;
    try {
      // Extract Korean text from AI response
      const koreanText = aiResponse.match(/[가-힣\s]+/g)?.join(' ').trim();
      if (koreanText && koreanText.length > 0) {
        audioBuffer = await this.generateKoreanAudio(koreanText);
      }
    } catch (error) {
      console.error('Error generating audio:', error);
      // Continue without audio - don't let this break the chat
    }

    // Send response to client
    socket.emit('aiResponse', {
      response: aiResponse,
      corrections: analysis.corrections,
      suggestions: analysis.suggestions,
      audio: audioBuffer ? audioBuffer.toString('base64') : null
    });

    // Track vocabulary usage
    this.trackVocabularyUsage(session, data.message);
  }

  private async analyzeKoreanInput(input: string): Promise<{
    koreanText?: string;
    corrections: string[];
    suggestions: string[];
  }> {
    try {
      const prompt = `
You are a Korean language tutor. Analyze this text and respond ONLY with valid JSON.

Text: "${input}"

Respond with this EXACT JSON format (no other text):
{
  "koreanText": "Korean text if present, otherwise null",
  "corrections": ["specific grammar corrections if any"],
  "suggestions": ["better ways to express this if any"]
}

If the text is perfect Korean, return empty arrays for corrections and suggestions.
Always be encouraging and helpful.
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
        temperature: 0.3, // Lower temperature for more consistent JSON
        max_tokens: 300,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No response from OpenAI');
      }

      // Try to parse JSON, but handle cases where AI returns plain text
      try {
        const parsed = JSON.parse(responseText);
        return {
          koreanText: parsed.koreanText || undefined,
          corrections: parsed.corrections || [],
          suggestions: parsed.suggestions || []
        };
      } catch (parseError) {
        // If JSON parsing fails, return a safe default response
        console.log('AI returned non-JSON response, using default analysis');
        return {
          koreanText: responseText.includes('한국어') ? responseText : undefined,
          corrections: [],
          suggestions: ['Keep practicing! Your Korean is improving!']
        };
      }
    } catch (error) {
      console.error('Error analyzing Korean input:', error);
      return {
        koreanText: undefined,
        corrections: [],
        suggestions: []
      };
    }
  }

  private async generateAIResponse(userInput: string, session: ChatSession): Promise<string> {
    try {
      // Get user's learned vocabulary from database
      const userVocabulary = await this.database.getAllVocabulary();
      const recentWords = userVocabulary
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
        .slice(0, 5)
        .map(word => `${word.korean} (${word.english})`)
        .join(', ');

      const prompt = `
You are a friendly Korean conversation partner and tutor. The user just said: "${userInput}"

Conversation context:
- Topic: ${session.topic}
- Difficulty level: ${session.difficulty}
- Previous vocabulary used: ${session.vocabularyUsed.join(', ')}

IMPORTANT: Use the user's learned vocabulary in your response:
- Recent words (last week): ${recentWords}
- Essential words: ${essentialWordsList}

Your response should:
1. Acknowledge what they said
2. Ask a follow-up question using their learned vocabulary
3. Occasionally ask them to use specific words in sentences
4. Test them on vocabulary they've learned
5. Be encouraging and educational

Respond in Korean only, be natural and conversational.
`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a friendly Korean conversation partner. Always respond in Korean. Keep responses natural and conversational.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5, // Lower temperature for more consistent responses
        max_tokens: 100, // Shorter responses to avoid issues
      });

      const response = completion.choices[0]?.message?.content;
      return response || '정말요? 더 자세히 말해주세요!';
    } catch (error) {
      console.error('Error generating AI response:', error);
      return '죄송해요, 다시 말해주세요.';
    }
  }

  private async generateSimpleAIResponse(userInput: string): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a friendly Korean conversation partner. Respond in Korean only. Keep responses short and simple.'
          },
          {
            role: 'user',
            content: userInput
          }
        ],
        temperature: 0.3,
        max_tokens: 50,
      });

      const response = completion.choices[0]?.message?.content;
      return response || '안녕하세요!';
    } catch (error) {
      console.error('Error generating simple AI response:', error);
      return '안녕하세요!';
    }
  }

  private async generateKoreanAudio(koreanText: string): Promise<Buffer> {
    try {
      const response = await this.openai.audio.speech.create({
        model: "tts-1",
        voice: "nova", // Good voice for Korean
        input: koreanText,
        response_format: "mp3"
      });
      
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      console.error('Error generating Korean audio:', error);
      throw error;
    }
  }

  private trackVocabularyUsage(session: ChatSession, input: string): void {
    // Extract Korean words from input
    const koreanWords = input.match(/[가-힣]+/g) || [];
    session.vocabularyUsed.push(...koreanWords);
    
    // Update database with word frequency
    koreanWords.forEach(word => {
      this.database.incrementWordFrequency(word);
    });
  }

  private async handleVocabularyTest(socket: any, sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    try {
      // Get words for testing
      const reviewWords = await this.database.getWordsForSpacedRepetition(7);
      const essentialWords = await this.database.getEssentialWords();
      const testWords = [...reviewWords.slice(0, 3), ...essentialWords.slice(0, 2)];

      if (testWords.length === 0) {
        socket.emit('aiResponse', {
          response: '아직 테스트할 단어가 없어요. 먼저 단어를 배워보세요!',
          corrections: [],
          suggestions: []
        });
        return;
      }

      // Generate test question
      const randomWord = testWords[Math.floor(Math.random() * testWords.length)];
      const prompt = `
Create a Korean vocabulary test question for the word: ${randomWord.korean} (${randomWord.english})

Generate a question that tests understanding of this word. Examples:
- "What does '${randomWord.korean}' mean?"
- "Use '${randomWord.korean}' in a sentence"
- "What's the opposite of '${randomWord.korean}'?"

Respond in Korean with the question.
`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a Korean language tutor creating vocabulary tests.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 100,
      });

      const testQuestion = completion.choices[0]?.message?.content || `'${randomWord.korean}'의 뜻이 뭐예요?`;

      socket.emit('aiResponse', {
        response: `📚 단어 테스트: ${testQuestion}`,
        corrections: [],
        suggestions: [`정답: ${randomWord.korean} = ${randomWord.english}`],
        audio: null // No audio for test questions
      });

    } catch (error) {
      console.error('Error generating vocabulary test:', error);
      socket.emit('error', '단어 테스트를 생성할 수 없어요.');
    }
  }

  private async handleSentencePractice(socket: any, sessionId: string, data: any): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    try {
      // Get words for sentence practice
      const recentWords = await this.database.getAllVocabulary();
      const wordsForPractice = recentWords
        .filter(word => {
          const wordDate = new Date(word.dateAdded);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return wordDate > weekAgo;
        })
        .slice(0, 5);

      if (wordsForPractice.length === 0) {
        socket.emit('aiResponse', {
          response: '문장 연습할 단어가 없어요. 먼저 단어를 배워보세요!',
          corrections: [],
          suggestions: []
        });
        return;
      }

      const randomWord = wordsForPractice[Math.floor(Math.random() * wordsForPractice.length)];
      const prompt = `
Ask the user to make a sentence using the Korean word: ${randomWord.korean} (${randomWord.english})

Create a friendly request in Korean asking them to use this word in a sentence.
Be encouraging and supportive.
`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a friendly Korean language tutor asking for sentence practice.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 100,
      });

      const sentenceRequest = completion.choices[0]?.message?.content || `'${randomWord.korean}'를 사용해서 문장을 만들어보세요!`;

      socket.emit('aiResponse', {
        response: `✍️ 문장 연습: ${sentenceRequest}`,
        corrections: [],
        suggestions: [`단어: ${randomWord.korean} (${randomWord.english})`],
        audio: null // No audio for practice requests
      });

    } catch (error) {
      console.error('Error generating sentence practice:', error);
      socket.emit('error', '문장 연습을 생성할 수 없어요.');
    }
  }

  async startServer(port: number = 3000): Promise<void> {
    this.server.listen(port, () => {
      console.log(`🚀 Korean Chat Companion server running on http://localhost:${port}`);
      console.log('🗣️ Ready for Korean conversation practice!');
    });
  }

  close(): void {
    this.server.close();
    this.database.close();
    this.learningSystem.close();
  }
}

// Start the chat companion server
const chatCompanion = new KoreanChatCompanion();
chatCompanion.startServer(3000);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Stopping Korean Chat Companion...');
  chatCompanion.close();
  process.exit(0);
});
