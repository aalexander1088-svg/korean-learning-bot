# 📚 Google Docs Integration Setup Guide

## Why Google Docs Integration?

Instead of using the same PDF file every day, your Korean learning bot will now:
- ✅ **Pull from your Google Doc** with your most recent vocabulary
- ✅ **Get the last 50 lines** (most recent words) from the bottom of your doc
- ✅ **Always use fresh content** - no more repetitive emails!
- ✅ **Automatically update** as you add new words to your doc

## Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** (or select existing one)
3. **Name it**: "Korean Learning Bot" (or whatever you prefer)

## Step 2: Enable Google Docs API

1. **Go to APIs & Services → Library**
2. **Search for "Google Docs API"**
3. **Click "Enable"**
4. **Also enable "Google Drive API"** (needed for metadata)

## Step 3: Create Service Account

1. **Go to APIs & Services → Credentials**
2. **Click "Create Credentials" → "Service Account"**
3. **Fill in details**:
   - Name: `korean-learning-bot`
   - Description: `Service account for Korean learning email bot`
4. **Click "Create and Continue"**
5. **Skip roles for now** (click "Continue")
6. **Click "Done"**

## Step 4: Generate Service Account Key

1. **Find your service account** in the credentials list
2. **Click on the service account email**
3. **Go to "Keys" tab**
4. **Click "Add Key" → "Create new key"**
5. **Choose "JSON" format**
6. **Click "Create"**
7. **Download the JSON file** (keep it secure!)

## Step 5: Share Your Google Doc

1. **Open your Korean vocabulary Google Doc**
2. **Click "Share" button**
3. **Add your service account email** (from the JSON file)
4. **Give it "Viewer" permission**
5. **Click "Send"**

## Step 6: Get Your Document ID

From your Google Doc URL:
```
https://docs.google.com/document/d/1ABC123DEF456GHI789JKL/edit
                                    ^^^^^^^^^^^^^^^^^^^^
                                    This is your DOCUMENT_ID
```

## Step 7: Configure Environment Variables

Add these to your `.env` file:

```bash
# Google Docs Configuration
GOOGLE_DOC_ID=1ABC123DEF456GHI789JKL

# From your downloaded JSON file:
GOOGLE_SERVICE_ACCOUNT_EMAIL=korean-learning-bot@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

## Step 8: Test the Integration

```bash
# Build the project
npm run build

# Test the Korean learning bot
npm run schedule -- --test
```

## How It Works Now

1. **Every day at 5:00 AM CST**, the bot will:
   - Connect to your Google Doc
   - Get the last 50 lines (your most recent vocabulary)
   - Analyze the content with AI
   - Create practice exercises based on your recent words
   - Send you a personalized email

2. **Your Google Doc should contain**:
   - Korean vocabulary words
   - English translations
   - Example sentences
   - Grammar notes
   - Any Korean text you want to practice

## Example Google Doc Format

```
새로운 단어들:
- 달리기 (running)
- 그림 (painting) 
- 화가 (painter)
- 벽 (wall)
- 걸다 (to hang)

문법 패턴:
- V-고 싶어요 (want to do)
- N-을/를 좋아해요 (like to do)

예문:
- 그림을 그리는 것을 좋아해요.
- 화가가 되고 싶어요.
```

## Troubleshooting

### If the bot can't access your Google Doc:
1. **Check the service account email** is shared with the doc
2. **Verify the document ID** is correct
3. **Make sure the Google Docs API is enabled**

### If you get authentication errors:
1. **Check your private key** format (needs `\n` for newlines)
2. **Verify the service account email** is correct
3. **Make sure the JSON file was downloaded correctly**

## Benefits

✅ **Always fresh content** - pulls from your most recent vocabulary
✅ **No more repetitive emails** - each day uses different words
✅ **Easy to update** - just add new words to your Google Doc
✅ **Automatic** - works with GitHub Actions in the cloud
✅ **Personalized** - uses your actual learning progress

Your Korean learning emails will now be much more relevant and helpful! 🎉




