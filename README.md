# Korean Learning Bot System

A comprehensive Korean language learning system that combines AI-powered analysis, automated email delivery, and interactive practice tools.

## 🌟 Features

- 📧 **Daily News Email**: Automated news digest in Korean and English
- 🇰🇷 **Korean Learning Email**: AI-generated practice exercises from your PDF lessons
- 🤖 **Telegram Bot**: Hourly vocabulary practice and interactive quizzes
- 📚 **PDF Analysis**: Extracts vocabulary and grammar from Korean lesson PDFs
- 🧠 **AI Integration**: Uses OpenAI to create personalized learning content
- ☁️ **Cloud Automation**: Runs on GitHub Actions for 24/7 operation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Gmail account with App Password
- OpenAI API key
- Telegram Bot Token (for Telegram features)

### Installation
```bash
# Clone the repository
git clone https://github.com/aalexander1088-svg/korean-learning-bot.git
cd korean-learning-bot

# Install dependencies
npm install

# Build the project
npm run build
```

### Configuration
1. Copy `env.example` to `.env` and fill in your credentials
2. Set up GitHub Secrets for automated workflows
3. Add your Korean lesson PDF to the `pdfs/` directory

## 📧 Email Features

### Daily News Email (5:00 AM CST)
- Scrapes news from multiple sources
- Sends formatted HTML email digest
- Mobile-optimized design

### Korean Learning Email (5:00 AM CST)
- Analyzes your Korean lesson PDF
- Generates practice exercises using your vocabulary
- Creates personalized quizzes and examples

## 🤖 Telegram Bot Features

- **Hourly Vocabulary**: Sends Korean words every hour
- **Interactive Quizzes**: "Use this word in a sentence" or "What does this mean?"
- **Progress Tracking**: Monitors your learning progress
- **Customizable Schedule**: Adjust frequency and content type

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Run in development mode
npm run build           # Build TypeScript to JavaScript

# Email Features
npm run news-bot        # Send news email
npm run send-test-email # Test email functionality

# Korean Learning
npm run korean-agent    # Interactive Korean conversation
npm run import-vocab    # Import vocabulary from PDF
npm run show-vocab      # Display vocabulary database

# Server Features
npm run chat            # Start chat server
npm run simple-chat     # Simple chat interface
```

## ☁️ GitHub Actions Workflows

### Daily News Email
- **File**: `.github/workflows/daily-news-only.yml`
- **Schedule**: Every day at 5:00 AM CST
- **Purpose**: Automated news digest

### Daily Korean Learning Email
- **File**: `.github/workflows/daily-korean-only.yml`
- **Schedule**: Every day at 5:00 AM CST
- **Purpose**: Korean practice exercises

### Hourly Telegram Bot
- **File**: `.github/workflows/hourly-telegram-bot.yml`
- **Schedule**: Every hour
- **Purpose**: Vocabulary practice

## 🔐 Required GitHub Secrets

Set these up in your repository settings:

- `EMAIL_USER`: Your Gmail address
- `EMAIL_PASSWORD`: Gmail App Password (16 characters)
- `DEFAULT_EMAIL`: Your email address
- `NEWS_RECIPIENT_EMAIL`: Where to send news emails
- `OPENAI_API_KEY`: Your OpenAI API key
- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
- `TELEGRAM_CHAT_ID`: Your Telegram chat ID

## 📁 Project Structure

```
korean-learning-bot/
├── src/                    # TypeScript source files
│   ├── news-email-bot.ts   # News email functionality
│   ├── news-scraper.ts     # News scraping logic
│   ├── index.ts           # Main Korean learning script
│   ├── reliable-scheduler.ts # Email scheduler
│   └── telegram-bot.ts     # Telegram bot functionality
├── .github/workflows/      # GitHub Actions workflows
├── pdfs/                   # Korean lesson PDFs
├── dist/                   # Compiled JavaScript
└── korean_learning.db     # SQLite vocabulary database
```

## 🎯 Learning Features

### Vocabulary Management
- Extracts Korean words from PDF lessons
- Stores vocabulary in SQLite database
- Tracks learning progress and frequency

### AI-Powered Content
- Generates practice sentences using your vocabulary
- Creates personalized quizzes
- Provides grammar explanations

### Interactive Practice
- Telegram bot for continuous learning
- Email-based practice exercises
- Progress tracking and analytics

## 🔧 Customization

### Email Templates
Modify email templates in:
- `src/news-email-bot.ts` (news emails)
- `src/index.ts` (Korean learning emails)

### Telegram Bot Commands
Add new commands in `src/telegram-bot.ts`

### Learning Schedule
Adjust timing in GitHub Actions workflow files

## 📊 Monitoring

### GitHub Actions
- Monitor workflow runs in the Actions tab
- Check logs for debugging
- Manual trigger for testing

### Email Delivery
- Check your inbox for daily emails
- Verify email formatting and content

### Telegram Bot
- Test bot responses
- Monitor hourly message delivery

## 🚨 Troubleshooting

### Common Issues

**Email Not Sending**
- Verify Gmail App Password (not regular password)
- Check GitHub Secrets configuration
- Review workflow logs

**Telegram Bot Not Responding**
- Verify bot token and chat ID
- Check bot permissions
- Review hourly workflow logs

**PDF Analysis Issues**
- Ensure PDF is in `pdfs/` directory
- Check file permissions
- Verify OpenAI API key

## 📈 Future Enhancements

- [ ] Spaced repetition algorithm
- [ ] Voice message support
- [ ] Progress analytics dashboard
- [ ] Multiple language support
- [ ] Mobile app integration

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests to improve the system.

## 📄 License

MIT License - Personal use and educational purposes.

---

**Happy Korean learning! 🇰🇷📚**