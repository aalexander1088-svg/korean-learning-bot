# 🚀 GitHub Actions Setup Guide

## Prerequisites
1. **Install Git** (if not already installed):
   - Download from: https://git-scm.com/download/win
   - Or install via winget: `winget install Git.Git`

2. **Create a GitHub account** (if you don't have one):
   - Go to: https://github.com

## Step 1: Initialize Git Repository

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Korean learning and news bot"

# Add your GitHub repository as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/korean-learning-bot.git

# Push to GitHub
git push -u origin main
```

## Step 2: Set Up GitHub Secrets

1. **Go to your GitHub repository**
2. **Click on "Settings" tab**
3. **Click on "Secrets and variables" → "Actions"**
4. **Click "New repository secret" and add each of these:**

### Required Secrets:
- **Name**: `EMAIL_USER` | **Value**: aalexander1088@gmail.com
- **Name**: `EMAIL_PASSWORD` | **Value**: `your_gmail_app_password`
- **Name**: `DEFAULT_EMAIL` | **Value**: aalexander1088@gmail.com
- **Name**: `NEWS_RECIPIENT_EMAIL` | **Value**: aalexander1088@gmail.com
- **Name**: `OPENAI_API_KEY` | **Value**: `your_openai_api_key`

## Step 3: Test the Workflow

1. **Go to "Actions" tab in your GitHub repository**
2. **Click on "Daily News Bot" workflow**
3. **Click "Run workflow" to test it manually**
4. **Check the logs to make sure everything works**

## Step 4: Verify Schedule

The workflow is set to run at **5:00 AM CST (11:00 AM UTC)** every day.

## Troubleshooting

### If the workflow fails:
1. **Check the logs** in the Actions tab
2. **Verify all secrets are set correctly**
3. **Make sure your email app password is correct**

### If emails aren't being sent:
1. **Check your Gmail app password** (not your regular password)
2. **Verify the recipient email address**
3. **Check spam folder**

## Manual Trigger

You can manually trigger the workflow anytime by:
1. Going to Actions tab
2. Clicking "Daily News Bot"
3. Clicking "Run workflow"

## Schedule Details

- **Korean Learning**: Runs at 5:00 AM CST (if Korean PDF is available)
- **News Digest**: Runs at 5:00 AM CST (always runs)
- **Timezone**: Central Standard Time (CST)
- **Frequency**: Daily

## Files Created

- `.github/workflows/daily-news-bot.yml` - GitHub Actions workflow
- `.gitignore` - Git ignore file
- All your existing source files

## Next Steps

1. **Install Git** (if needed)
2. **Create GitHub repository**
3. **Push your code**
4. **Set up secrets**
5. **Test the workflow**

Your bot will now run automatically every day at 5:00 AM CST, even when your computer is off! 🎉


