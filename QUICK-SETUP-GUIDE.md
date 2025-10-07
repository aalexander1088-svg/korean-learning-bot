# 🚀 Quick Google Docs Setup for Your Korean Learning Bot

## Your Document Details
- **Document ID**: `1x0ZQkc4fNTKB8H-P_cYQQtv85GCNrytfENizgmC3peQ`
- **Document Title**: "9-10월 수업" (September-October Class)
- **URL**: https://docs.google.com/document/d/1x0ZQkc4fNTKB8H-P_cYQQtv85GCNrytfENizgmC3peQ/edit

## Quick Setup Steps

### Step 1: Create Google Cloud Project (5 minutes)
1. Go to: https://console.cloud.google.com/
2. Click "Create Project"
3. Name: "Korean Learning Bot"
4. Click "Create"

### Step 2: Enable APIs (2 minutes)
1. Go to "APIs & Services" → "Library"
2. Search "Google Docs API" → Enable
3. Search "Google Drive API" → Enable

### Step 3: Create Service Account (3 minutes)
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Name: `korean-learning-bot`
4. Click "Create and Continue" → "Continue" → "Done"

### Step 4: Generate Key (2 minutes)
1. Click on your service account email
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key" → "JSON"
4. Download the JSON file

### Step 5: Share Your Document (1 minute)
1. Open your Google Doc: https://docs.google.com/document/d/1x0ZQkc4fNTKB8H-P_cYQQtv85GCNrytfENizgmC3peQ/edit
2. Click "Share" button
3. Add the service account email (from the JSON file)
4. Give "Viewer" permission
5. Click "Send"

### Step 6: Configure Environment Variables
Add these to your `.env` file:

```bash
# Google Docs Configuration
GOOGLE_DOC_ID=1x0ZQkc4fNTKB8H-P_cYQQtv85GCNrytfENizgmC3peQ

# From your downloaded JSON file:
GOOGLE_SERVICE_ACCOUNT_EMAIL=korean-learning-bot@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

### Step 7: Test the Integration
```bash
npm run test-google-docs
```

## What Will Happen

Once set up, your Korean learning bot will:
- ✅ **Connect to your "9-10월 수업" document**
- ✅ **Get the last 50 lines** (your most recent vocabulary)
- ✅ **Create practice exercises** based on your recent words
- ✅ **Send personalized emails** every day at 5:00 AM CST

## Your Document Structure

Make sure your Google Doc contains Korean vocabulary in a format like:
```
새로운 단어들:
- 달리기 (running)
- 그림 (painting)
- 화가 (painter)

문법 패턴:
- V-고 싶어요 (want to do)
- N-을/를 좋아해요 (like to do)

예문:
- 그림을 그리는 것을 좋아해요.
- 화가가 되고 싶어요.
```

## Troubleshooting

If you get errors:
1. **Check the service account email** is shared with your doc
2. **Verify the document ID** is correct: `1x0ZQkc4fNTKB8H-P_cYQQtv85GCNrytfENizgmC3peQ`
3. **Make sure both APIs are enabled** (Docs API and Drive API)

## Benefits

🎯 **No more repetitive emails** - uses your actual recent vocabulary
📚 **Always fresh content** - pulls from the bottom of your doc
🔄 **Easy to update** - just add new words to your Google Doc
🤖 **Fully automated** - works with GitHub Actions

Your Korean learning will be much more personalized and effective! 🎉




