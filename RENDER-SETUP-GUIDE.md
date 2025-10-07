# Render Korean Telegram Bot Setup Guide

## 🚀 What This Does

This creates a **super fast** Korean vocabulary bot that:
- ✅ **Runs on Render** (2-5 second response time)
- ✅ **Uses your PDF vocabulary** (pre-loaded in cloud)
- ✅ **No desktop dependency** (everything in cloud)
- ✅ **Interactive features** (quiz, study mode, stats)
- ✅ **Hourly messages** (7 AM - 6 PM CST)
- ✅ **FREE TIER** (750 hours/month)

## 📋 Setup Steps

### 1. Create Render Account
1. Go to: https://render.com
2. Sign up with GitHub
3. Click "New" → "Web Service"

### 2. Connect Your Repository
1. Select your `korean-learning-bot` repository
2. Render will automatically detect it's a Node.js project

### 3. Configure Settings
- **Name**: `korean-telegram-bot`
- **Runtime**: `Node`
- **Build Command**: `npm run build`
- **Start Command**: `npm run railway-bot`

### 4. Add Environment Variables
In Render dashboard, add these variables:

```
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_PATH=/opt/render/project/src/korean_vocabulary.db
```

### 5. Deploy
1. Click "Create Web Service"
2. Your bot will be live in ~3 minutes
3. Test with `/start` in Telegram

## 🎯 Features

### Interactive Commands
- `/start` - Welcome message
- `/word` - Get random Korean word
- `/quiz` - 5-question quiz
- `/study` - Study mode
- `/stats` - Learning statistics
- `/help` - Show all commands

### Hourly Automation
- **Schedule**: Every hour from 7 AM - 6 PM CST
- **Content**: Korean words from your PDF
- **Format**: Word + meaning + example sentence

## 📊 Performance

### Speed Comparison
- **GitHub Actions**: ~15-20 seconds
- **Render**: ~2-5 seconds ⚡

### Reliability
- **Uptime**: 99.9% (Render SLA)
- **Auto-restart**: If bot crashes
- **Scaling**: Automatic

## 🔧 Technical Details

### Database
- **Type**: SQLite (persistent)
- **Location**: `/opt/render/project/src/korean_vocabulary.db`
- **Content**: 30+ words from your PDF
- **Features**: Statistics, progress tracking

### Vocabulary Source
- **Extracted from**: Your Korean lesson PDF
- **Pre-loaded**: No desktop access needed
- **Categories**: Beginner, Intermediate, Advanced

## 🚀 Next Steps

1. **Deploy to Render** (follow steps above)
2. **Test the bot** (send `/start` in Telegram)
3. **Set up hourly schedule** (GitHub Actions)
4. **Monitor performance** (Render dashboard)

## 💰 Cost

- **Free Tier**: 750 hours/month
- **Your Usage**: ~12 hours/day = 360 hours/month
- **Cost**: $0 (within free tier)

## 🆘 Troubleshooting

### Bot Not Responding
1. Check Render logs
2. Verify environment variables
3. Test with `/start` command

### Database Issues
1. Check database file exists
2. Verify vocabulary is loaded
3. Check Render file system

### OpenAI Errors
1. Verify API key is correct
2. Check API usage limits
3. Monitor OpenAI dashboard

## 📞 Support

If you need help:
1. Check Render logs
2. Test locally first
3. Contact support with error details
