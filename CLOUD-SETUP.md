# Korean Learning Email - Cloud Setup Guide

## Problem
Windows Task Scheduler doesn't run when your computer is locked or in sleep mode.

## Solution: GitHub Actions (Cloud-based)
GitHub Actions runs in the cloud, so it works regardless of your computer's state.

## Setup Steps

### 1. Create GitHub Repository
1. Go to [GitHub.com](https://github.com)
2. Create a new repository called `korean-learning-emails`
3. Upload your project files

### 2. Add Secrets to GitHub
Go to your repository → Settings → Secrets and variables → Actions

Add these secrets:
- `OPENAI_API_KEY`: Your OpenAI API key
- `EMAIL_USER`: Your Gmail address
- `EMAIL_PASS`: Your Gmail app password
- `EMAIL_HOST`: smtp.gmail.com
- `EMAIL_PORT`: 587

### 3. Enable GitHub Actions
The workflow file `.github/workflows/korean-learning-daily.yml` is already created.

### 4. Test the Workflow
1. Go to Actions tab in your repository
2. Click "Korean Learning Daily Email"
3. Click "Run workflow" to test

## Benefits
- ✅ Runs even when computer is locked/sleeping
- ✅ Runs even when computer is off
- ✅ Reliable cloud infrastructure
- ✅ Free for public repositories
- ✅ Manual trigger available
- ✅ Email logs in GitHub Actions

## Alternative: Keep Local + Cloud Backup
You can run both:
- Local Windows Task Scheduler (when computer is on)
- GitHub Actions (as backup when computer is off/locked)

## Time Zone
The workflow runs at 5:00 AM Central Time (Chicago time):
- **Current setting**: `0 11 * * *` (11:00 AM UTC = 5:00 AM CST/CDT)
- **Central Standard Time (CST)**: UTC-6 (winter)
- **Central Daylight Time (CDT)**: UTC-5 (summer)

GitHub Actions uses UTC, so the cron schedule is set to 11:00 AM UTC to match 5:00 AM Central Time.

## Manual Trigger
You can manually trigger the workflow anytime from GitHub Actions tab.
