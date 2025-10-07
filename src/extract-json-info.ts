#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';

function extractServiceAccountInfo() {
  console.log('🔍 Google Service Account Info Extractor\n');

  // Look for JSON files in common locations
  const possiblePaths = [
    path.join(process.cwd(), 'service-account-key.json'),
    path.join(process.cwd(), 'korean-learning-bot.json'),
    path.join(process.cwd(), 'google-service-account.json'),
    path.join(process.env.USERPROFILE || '', 'Downloads', 'service-account-key.json'),
    path.join(process.env.USERPROFILE || '', 'Downloads', 'korean-learning-bot.json'),
    path.join(process.env.USERPROFILE || '', 'Downloads', 'google-service-account.json'),
  ];

  let jsonFile = null;
  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      jsonFile = filePath;
      break;
    }
  }

  if (!jsonFile) {
    console.log('❌ Could not find your Google service account JSON file.');
    console.log('📁 Please make sure your JSON file is in one of these locations:');
    possiblePaths.forEach(p => console.log(`   - ${p}`));
    console.log('\n💡 Or drag and drop your JSON file into this folder and rename it to "service-account-key.json"');
    return;
  }

  try {
    console.log(`📄 Found JSON file: ${jsonFile}`);
    
    const jsonContent = fs.readFileSync(jsonFile, 'utf8');
    const serviceAccount = JSON.parse(jsonContent);

    console.log('\n✅ Successfully parsed JSON file!');
    console.log('\n📋 Here are the values you need for your .env file:\n');

    console.log('─'.repeat(60));
    console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL=' + serviceAccount.client_email);
    console.log('─'.repeat(60));
    
    console.log('\nGOOGLE_PRIVATE_KEY="' + serviceAccount.private_key + '"');
    console.log('─'.repeat(60));

    console.log('\n📝 Copy these lines and add them to your .env file:');
    console.log('\n' + '='.repeat(60));
    console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL=' + serviceAccount.client_email);
    console.log('GOOGLE_PRIVATE_KEY="' + serviceAccount.private_key + '"');
    console.log('='.repeat(60));

    console.log('\n🎯 Next steps:');
    console.log('1. Copy the lines above');
    console.log('2. Add them to your .env file');
    console.log('3. Run: npm run test-google-docs');

  } catch (error) {
    console.error('❌ Error reading JSON file:', error);
    console.log('\n💡 Make sure your JSON file is valid and not corrupted');
  }
}

extractServiceAccountInfo();



