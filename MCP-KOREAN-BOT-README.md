# 🇰🇷 Enhanced Korean Learning Bot with MCP Integration

An advanced Korean language learning bot powered by Model Context Protocol (MCP) that provides personalized, adaptive learning experiences through Telegram.

## 🚀 **Core Features**

### 📚 **Advanced Quiz System**
- **Multiple Quiz Types:**
  - Vocabulary quizzes (Korean ↔ English)
  - Grammar pattern recognition
  - Sentence completion exercises
  - Fill-in-the-blank questions
  - Mixed adaptive quizzes

- **Difficulty Levels:**
  - **Beginner**: Basic vocabulary and simple grammar
  - **Intermediate**: Common phrases and compound sentences
  - **Advanced**: Complex grammar and idiomatic expressions

### 🧠 **Intelligent Learning System**
- **Adaptive Quizzes**: Questions tailored to your proficiency level
- **Spaced Repetition**: Scientifically-backed algorithm for optimal retention
- **Weak Area Detection**: Identifies and focuses on challenging topics
- **Personalized Recommendations**: AI-powered study suggestions

### 📊 **Comprehensive Progress Tracking**
- **User Profiles**: Track individual learning journeys
- **Performance Analytics**: Detailed insights into learning patterns
- **Streak Tracking**: Maintain consistent study habits
- **Mastery Levels**: Monitor vocabulary and grammar progression

### 🎯 **Interactive Features**
- **Korean Word Learning**: Send any Korean word for instant learning
- **Real-time Feedback**: Immediate corrections and explanations
- **Cultural Context**: Learn usage patterns and cultural nuances
- **Example Sentences**: Practical, everyday Korean examples

## 🏗️ **Architecture**

### **MCP Integration**
The system uses Model Context Protocol to create a sophisticated learning environment:

```typescript
// Core MCP System
class MCPKoreanLearningSystem {
  // User profile management
  // Adaptive quiz generation
  // Spaced repetition algorithm
  // Progress tracking and analytics
  // Learning insights generation
}
```

### **Database Schema**
Enhanced SQLite database with comprehensive tracking:

- **user_profiles**: Individual user data and preferences
- **quiz_sessions**: Complete quiz history and performance
- **quiz_questions**: Detailed question tracking with timing
- **learning_progress**: Comprehensive progress metrics
- **spaced_repetition**: SM-2 algorithm implementation
- **user_vocabulary**: Personal vocabulary mastery tracking

### **Bot Architecture**
Modular Telegram bot with advanced features:

```typescript
class EnhancedKoreanBot {
  // MCP system integration
  // Interactive quiz handling
  // Korean word learning
  // Progress tracking
  // User session management
}
```

## 🎮 **Usage**

### **Getting Started**
1. **Start the bot**: `/start`
2. **Set your level**: `/level` (Beginner/Intermediate/Advanced)
3. **Begin learning**: Send any Korean word
4. **Take quizzes**: `/quiz`

### **Quiz Commands**
- `/quiz` - Start an adaptive quiz
- `/progress` - View your learning progress
- `/insights` - Get detailed learning analytics
- `/level` - Set difficulty level
- `/help` - Show all commands

### **Learning Modes**
- **Korean Word Learning**: Send Korean words to learn meanings and usage
- **Interactive Quizzes**: Multiple choice, fill-in-blank, sentence completion
- **Progress Review**: Track improvement over time

## 🔧 **Technical Implementation**

### **Spaced Repetition Algorithm**
Implements the SM-2 algorithm for optimal learning intervals:

```typescript
private calculateNextInterval(item: SpacedRepetitionItem, quality: number): number {
  if (quality < 3) return 1; // Reset to 1 day
  if (item.repetitions === 0) return 1;
  if (item.repetitions === 1) return 6;
  return Math.round(item.interval * item.easeFactor);
}
```

### **Adaptive Quiz Generation**
AI-powered question generation based on user level and weak areas:

```typescript
async generateAdaptiveQuiz(
  userId: string, 
  quizType: QuizType, 
  difficulty: DifficultyLevel,
  questionCount: number = 10
): Promise<QuizSession>
```

### **Progress Analytics**
Comprehensive learning insights and recommendations:

```typescript
async generateLearningInsights(userId: string): Promise<{
  overallProgress: LearningProgress;
  recentPerformance: PerformanceAnalysis;
  weakAreas: WeakWord[];
  recommendations: string[];
}>
```

## 📈 **Learning Analytics**

### **Performance Metrics**
- **Accuracy Rate**: Overall quiz performance
- **Learning Trend**: Improvement over time
- **Weak Areas**: Topics needing focus
- **Study Streak**: Consistency tracking
- **Vocabulary Mastery**: Word retention rates

### **Personalized Insights**
- **Learning Recommendations**: AI-generated study suggestions
- **Optimal Study Times**: Personalized scheduling
- **Difficulty Progression**: Adaptive level adjustment
- **Cultural Context**: Usage pattern analysis

## 🚀 **Deployment**

### **Environment Setup**
```bash
# Install dependencies
npm install

# Set environment variables
TELEGRAM_BOT_TOKEN=your_bot_token
OPENAI_API_KEY=your_openai_key
TELEGRAM_CHAT_ID=your_chat_id
```

### **Running the Bot**
```bash
# Development
npm run enhanced-bot

# Production
npm run build
npm run enhanced-bot-build
```

### **Database Migration**
```bash
# Run database migration
npm run migrate
```

## 🎯 **Key Benefits**

### **For Learners**
- **Personalized Experience**: Content adapted to your level
- **Efficient Learning**: Spaced repetition for optimal retention
- **Progress Tracking**: Clear visibility into improvement
- **Flexible Study**: Learn anytime, anywhere via Telegram

### **For Educators**
- **Comprehensive Analytics**: Detailed learning insights
- **Adaptive Content**: Questions that match student needs
- **Progress Monitoring**: Track individual and group progress
- **Cultural Integration**: Real-world usage examples

## 🔮 **Future Enhancements**

### **Planned Features**
- **Voice Recognition**: Pronunciation practice
- **Writing Practice**: Handwriting and typing exercises
- **Cultural Lessons**: Korean culture and customs
- **Group Learning**: Collaborative study sessions
- **Gamification**: Achievements and leaderboards

### **Advanced MCP Features**
- **Multi-modal Learning**: Text, audio, and visual content
- **Real-time Adaptation**: Dynamic difficulty adjustment
- **Cross-platform Sync**: Progress across devices
- **Teacher Dashboard**: Educator analytics and controls

## 📚 **Learning Methodology**

### **Spaced Repetition**
Based on cognitive science research for optimal memory retention:
- **Short intervals** for new material
- **Increasing intervals** for mastered content
- **Quality-based adjustment** of review timing

### **Adaptive Learning**
AI-powered personalization:
- **Difficulty scaling** based on performance
- **Weak area focus** for targeted improvement
- **Learning style adaptation** to individual preferences

### **Cultural Integration**
Real-world Korean usage:
- **Casual speech patterns** for practical communication
- **Cultural context** for appropriate usage
- **Regional variations** and formality levels

## 🛠️ **Development**

### **Contributing**
1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests and documentation
5. Submit a pull request

### **Testing**
```bash
# Run tests
npm test

# Test specific components
npm run test-quiz
npm run test-korean-learning
```

## 📄 **License**

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 **Support**

For questions, issues, or contributions:
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Documentation**: README and inline comments

---

**Happy Learning! 🇰🇷✨**

*Built with ❤️ for Korean language learners worldwide*
