# Korean Conversation Practice Agent

A conversational AI agent that helps you practice Korean vocabulary and grammar through natural conversations. The agent integrates with your personal vocabulary list from Google Docs and provides intelligent feedback and corrections.

## 🌟 Features

### Core Features
- **Natural Conversation Practice**: Chat in Korean or English with intelligent responses
- **Vocabulary Integration**: Uses your personal vocabulary from Google Docs
- **Grammar Practice**: Focuses on specific grammar patterns from your list
- **Scenario Role-Play**: Practice real-life situations (restaurant, shopping, meeting friends)
- **Intelligent Corrections**: Gentle feedback on mistakes with explanations
- **Progress Tracking**: Monitor your learning progress and vocabulary usage

### Practice Modes
1. **Free Conversation**: Open-ended chat about any topic
2. **Targeted Practice**: Focus on specific grammar patterns
3. **Scenario-Based**: Role-play real-life situations

### Smart Features
- **Spaced Repetition**: Brings back words you haven't used recently
- **Difficulty Adjustment**: Adapts to your skill level
- **Cultural Notes**: Explains cultural context when relevant
- **Click-to-Speak**: Korean text-to-speech for pronunciation
- **Vocabulary Highlighting**: Shows which words from your list are being used

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
```bash
# Copy the template
copy env-template-korean-agent.txt .env

# Edit .env and add your API keys
notepad .env
```

**Required:**
- `OPENAI_API_KEY`: Your OpenAI API key

**Optional (for Google Docs integration):**
- `GOOGLE_CLIENT_EMAIL`: Service account email
- `GOOGLE_PRIVATE_KEY`: Service account private key

### 3. Run the Agent
```bash
# Using the setup script (Windows)
setup-korean-agent.bat

# Or manually
npm run korean-agent
```

The agent will be available at: **http://localhost:3001**

## 📖 How to Use

### Basic Conversation
1. Open http://localhost:3001 in your browser
2. Type messages in Korean or English
3. The agent responds naturally using your vocabulary
4. Get corrections and suggestions for improvement

### Practice Modes

#### Free Conversation
- Natural chat about any topic
- Agent uses your vocabulary in context
- Mix of Korean and English based on your level

#### Targeted Practice
- Focus on specific grammar patterns
- Agent asks you to use particular structures
- Multiple chances to practice the same pattern

#### Scenario Practice
- Role-play situations like ordering food or shopping
- Uses relevant vocabulary for each scenario
- Tracks completed scenarios

### Special Commands
- **Test Words**: Get vocabulary quizzes
- **Practice Grammar**: Focus on specific grammar patterns
- **Start Scenario**: Begin role-play practice
- **Show Progress**: View your learning statistics

## 🔧 Google Docs Integration

### Setup Google Docs API (Optional)

1. **Google Cloud Console Setup**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google Docs API

2. **Create Service Account**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Download the JSON credentials file

3. **Configure Environment**
   ```bash
   # Extract from JSON file:
   GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
   ```

4. **Share Your Document**
   - Open your Google Doc
   - Share it with the service account email
   - Give "Viewer" permissions

### Document Format
Your Google Doc should contain:
```
안녕하세요 - hello
감사합니다 - thank you
맛있어요 - delicious
V-(으)ㄹ 만하다 - worth doing
V-고 싶으면 - if you want to do
```

## 🎯 Example Conversations

### Free Conversation
```
User: 안녕하세요! 오늘 날씨가 좋아요.
Agent: 안녕하세요! 네, 정말 좋은 날씨네요! 어떤 활동을 하고 싶어요? 
       [Hint: Try using "시간이 있어요" from your vocabulary]

User: 시간이 있어서 친구를 만나고 싶어요.
Agent: 좋은 생각이에요! 친구와 어디서 만날 거예요? 
       [Perfect! You used "시간이 있어요" correctly!]
```

### Grammar Practice
```
Agent: 📖 문법 연습: V-(으)ㄹ 만하다
       설명: worth doing / worth the effort
       예시: 먹을 만해요, 볼 만해요, 할 만해요
       
       이 문법을 사용해서 문장을 만들어보세요!

User: 이 영화는 볼 만해요.
Agent: 완벽해요! 👏 "볼 만해요"를 정확히 사용했어요!
       다른 예시도 만들어볼까요? "먹을 만해요"를 사용해보세요.
```

### Scenario Practice
```
Agent: 🎭 시나리오 시작: Ordering food at a restaurant
       사용할 단어들: 맛있어요, 주문하다, 메뉴, 음식, 음료
       사용할 문법: V-(으)ㄹ래요, V-고 싶어요
       
       이 상황에서 자연스럽게 대화해봅시다! 먼저 인사해보세요.

User: 안녕하세요. 메뉴를 주문하고 싶어요.
Agent: 안녕하세요! 어떤 음식을 드시고 싶으세요? 
       오늘은 특별히 맛있는 비빔밥이 있어요.
```

## 📊 Progress Tracking

The agent tracks:
- **Vocabulary Usage**: Which words you've used successfully
- **Grammar Practice**: Which patterns you've practiced
- **Conversation History**: Previous conversations and corrections
- **Difficulty Progression**: How your level is improving
- **Spaced Repetition**: Words that need review

View your progress by clicking "Show Progress" in the chat interface.

## 🛠️ Customization

### Adding Vocabulary
1. Edit your Google Doc with new vocabulary
2. The agent will automatically sync (if Google Docs API is configured)
3. Or manually add to the fallback vocabulary in `src/google-docs-parser.ts`

### Adding Grammar Patterns
Add new patterns to your Google Doc:
```
V-(으)ㄴ 것 같아요 - seems like
V-지 않아요 - don't do
V-(으)ㄹ 수 있어요 - can do
```

### Adding Scenarios
Edit `src/korean-conversation-agent.ts` to add new scenarios:
```typescript
private scenarios: PracticeScenario[] = [
  {
    name: 'hospital',
    description: 'Visiting a doctor',
    vocabulary: ['아프다', '약', '병원', '의사'],
    grammarPatterns: ['V-(으)면 안 돼요', 'V-아야/어야 해요'],
    difficulty: 'intermediate'
  }
];
```

## 🔧 Technical Details

### Architecture
- **Frontend**: HTML/CSS/JavaScript with Socket.IO
- **Backend**: Node.js with Express and Socket.IO
- **AI**: OpenAI GPT-4 for natural language processing
- **Database**: SQLite for progress tracking
- **APIs**: Google Docs API for vocabulary integration

### File Structure
```
src/
├── korean-conversation-agent.ts  # Main agent server
├── google-docs-parser.ts         # Google Docs integration
├── database.ts                   # Progress tracking
└── ... (existing files)
```

### Key Components
- **ConversationSession**: Tracks user progress and context
- **ChatMessage**: Stores conversation history with corrections
- **PracticeScenario**: Defines role-play situations
- **VocabularyItem**: User's personal vocabulary
- **GrammarPattern**: Grammar structures to practice

## 🚨 Troubleshooting

### Common Issues

**1. "OpenAI API key not found"**
- Make sure your `.env` file contains `OPENAI_API_KEY=your_key_here`
- Restart the server after adding the key

**2. "Google Docs API error"**
- Check your service account credentials in `.env`
- Ensure the service account has access to your document
- The agent will use fallback vocabulary if Google Docs fails

**3. "Port 3001 already in use"**
- Change the port in `src/korean-conversation-agent.ts`
- Or stop other services using port 3001

**4. "Vocabulary not loading"**
- Check your Google Doc format
- Ensure Korean-English pairs are on separate lines
- Try the fallback vocabulary first

### Getting Help
1. Check the console logs for error messages
2. Verify your `.env` file configuration
3. Test with the simple chat first: `npm run simple-chat`
4. Check your internet connection for API calls

## 🎓 Learning Tips

### For Beginners
- Start with "Free Conversation" mode
- Use simple Korean phrases mixed with English
- Focus on basic vocabulary first
- Don't worry about perfect grammar initially

### For Intermediate Learners
- Try "Targeted Practice" for specific grammar
- Use more Korean in your responses
- Challenge yourself with "Scenario Practice"
- Pay attention to corrections and explanations

### For Advanced Learners
- Use mostly Korean in conversations
- Focus on natural expressions and cultural context
- Try complex grammar patterns
- Help the agent learn from your advanced usage

## 🔮 Future Features

- **Voice Recognition**: Speak Korean and get corrections
- **Mobile App**: Native mobile interface
- **Group Practice**: Multiple learners in one session
- **Teacher Dashboard**: Monitor student progress
- **Advanced Analytics**: Detailed learning insights
- **Custom Vocabulary Lists**: Multiple vocabulary sources
- **Offline Mode**: Practice without internet connection

## 📝 License

This project is for personal learning use. Please respect the terms of service of the APIs used (OpenAI, Google Docs).

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests to improve the agent!

---

**Happy Korean learning! 화이팅! 🇰🇷**




