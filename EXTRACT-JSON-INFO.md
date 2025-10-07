# 📋 How to Extract Google Service Account Info from JSON

## Your JSON File Structure
Your downloaded JSON file should look something like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-name",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "korean-learning-bot@your-project.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/korean-learning-bot%40your-project.iam.gserviceaccount.com"
}
```

## What You Need to Extract

### 1. Service Account Email
Look for the `client_email` field:
```json
"client_email": "korean-learning-bot@your-project.iam.gserviceaccount.com"
```

### 2. Private Key
Look for the `private_key` field:
```json
"private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

## How to Add to Your .env File

### Step 1: Open your .env file
```bash
notepad .env
```

### Step 2: Add these lines (replace with your actual values):

```bash
# Google Docs Configuration
GOOGLE_DOC_ID=1x0ZQkc4fNTKB8H-P_cYQQtv85GCNrytfENizgmC3peQ

# From your JSON file:
GOOGLE_SERVICE_ACCOUNT_EMAIL=korean-learning-bot@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

## Important Notes:

1. **Keep the quotes** around the private key
2. **Keep the \n** characters in the private key (they represent newlines)
3. **Replace the example values** with your actual values from the JSON file
4. **Don't share your JSON file** - it contains sensitive credentials

## Example of What Your .env Should Look Like:

```bash
# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
DEFAULT_EMAIL=aalexander1088@gmail.com

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-key-here

# Google Docs Configuration
GOOGLE_DOC_ID=1x0ZQkc4fNTKB8H-P_cYQQtv85GCNrytfENizgmC3peQ
GOOGLE_SERVICE_ACCOUNT_EMAIL=korean-learning-bot@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

## Troubleshooting:

- **If you get errors**: Make sure the private key is on one line with \n characters
- **If the email doesn't work**: Double-check the client_email from your JSON file
- **If you can't find the JSON file**: Check your Downloads folder

## Next Step:
After adding these to your .env file, test the integration:
```bash
npm run test-google-docs
```




