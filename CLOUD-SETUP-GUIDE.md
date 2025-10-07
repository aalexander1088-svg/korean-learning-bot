# 🚀 Auto-Upload PDF to GitHub Setup Guide

Your Korean learning bot now automatically uploads your newest PDF to GitHub so it can run in the cloud even when your computer is off!

## ✅ What's Already Working

- **Local System**: Uses your desktop PDF when running locally
- **PDF Upload**: Automatically copies newest PDF to `pdfs/` folder
- **Dual Emails**: Sends 2 Korean learning emails + 1 news digest
- **Auto-Exit**: Test mode exits automatically (no more getting stuck!)

## 🔧 Next Steps to Enable Cloud Running

### 1. Install Git (if not already installed)
```bash
winget install Git.Git
```

### 2. Initialize Git Repository
```bash
git init
git add .
git commit -m "Initial commit - Korean Learning Bot with PDF upload"
```

### 3. Create GitHub Repository
1. Go to [GitHub.com](https://github.com) and create a new repository
2. Name it something like `korean-learning-bot`
3. Don't initialize with README (since you already have files)

### 4. Connect Local Repository to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/korean-learning-bot.git
git branch -M main
git push -u origin main
```

### 5. Set Up GitHub Secrets
In your GitHub repository, go to Settings → Secrets and variables → Actions, and add:

**Required Secrets:**
- `EMAIL_USER` - Your Gmail address
- `EMAIL_PASSWORD` - Your Gmail app password
- `DEFAULT_EMAIL` - Your email address
- `NEWS_RECIPIENT_EMAIL` - Your email address
- `OPENAI_API_KEY` - Your OpenAI API key
- `GOOGLE_DOC_ID` - Your Google Doc ID
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` - Your Google service account email
- `GOOGLE_PRIVATE_KEY` - Your Google private key

### 6. Upload Your PDF
```bash
npm run upload-pdf
git add pdfs/
git commit -m "Add Korean PDF for cloud processing"
git push
```

## 🎯 How It Works

### When Running Locally:
- Uses PDF from your desktop (`korean class notes` folder)
- Automatically uploads newest PDF to GitHub
- Sends emails immediately

### When Running in GitHub Actions (Cloud):
- Uses the uploaded PDF from the `pdfs/` folder
- Runs daily at 5:00 AM, 5:05 AM, and 5:10 AM CST
- Sends emails even when your computer is off

## 📧 Daily Email Schedule

1. **5:00 AM CST** - Korean Learning from PDF (your latest class notes)
2. **5:05 AM CST** - Korean Learning from Google Doc (your recent vocabulary)
3. **5:10 AM CST** - News Digest (Zero Hedge, VT Foreign Policy, Korea Times)

## 🔄 Keeping PDFs Updated

Every time you run the bot locally, it automatically uploads your newest PDF. To manually update:

```bash
npm run upload-pdf
git add pdfs/
git commit -m "Update Korean PDF"
git push
```

## 🧪 Testing

- **Test locally**: `npm run schedule -- --test`
- **Test news only**: `npm run schedule -- --news`
- **Upload PDF**: `npm run upload-pdf`

## 🎉 Benefits

- ✅ **Always runs** - Even when your computer is off
- ✅ **Always current** - Uses your newest PDF automatically
- ✅ **No maintenance** - Just add new PDFs to your desktop folder
- ✅ **Reliable** - GitHub Actions is very reliable
- ✅ **Free** - GitHub Actions is free for public repositories

Your Korean learning journey is now fully automated! 🇰🇷📚



