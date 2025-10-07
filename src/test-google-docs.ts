#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { GoogleDocsService } from './google-docs-service';

// Load environment variables
dotenv.config();

async function testGoogleDocsIntegration() {
  console.log('🧪 Testing Google Docs Integration...\n');

  // Check if required environment variables are set
  const requiredVars = [
    'GOOGLE_DOC_ID',
    'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_PRIVATE_KEY'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.log(`   - ${varName}`));
    console.log('\n📚 Please follow the setup guide in GOOGLE-DOCS-SETUP.md');
    process.exit(1);
  }

  try {
    const googleDocs = new GoogleDocsService();
    
    // Test connection
    console.log('🔗 Testing Google Docs API connection...');
    const connectionOk = await googleDocs.testConnection();
    
    if (!connectionOk) {
      console.log('❌ Failed to connect to Google Docs API');
      console.log('📚 Please check your service account credentials');
      process.exit(1);
    }

    // Test document access
    console.log('📄 Testing document access...');
    const docId = process.env.GOOGLE_DOC_ID!;
    const content = await googleDocs.getDocumentContent(docId);
    
    console.log(`✅ Successfully accessed Google Doc!`);
    console.log(`📊 Document stats:`);
    console.log(`   - Word count: ${content.wordCount}`);
    console.log(`   - Last modified: ${content.lastModified.toLocaleString()}`);
    
    // Test recent vocabulary extraction
    console.log('\n📚 Testing recent vocabulary extraction...');
    const recentVocab = await googleDocs.getRecentVocabulary(docId, 20);
    
    console.log(`✅ Successfully extracted recent vocabulary!`);
    console.log(`📝 Recent content preview:`);
    console.log('─'.repeat(50));
    console.log(recentVocab.substring(0, 300) + (recentVocab.length > 300 ? '...' : ''));
    console.log('─'.repeat(50));
    
    console.log('\n🎉 Google Docs integration is working perfectly!');
    console.log('📧 Your Korean learning emails will now use fresh content from your Google Doc!');
    
  } catch (error) {
    console.error('❌ Error testing Google Docs integration:', error);
    console.log('\n📚 Please check the setup guide in GOOGLE-DOCS-SETUP.md');
    process.exit(1);
  }
}

// Run the test
testGoogleDocsIntegration().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});




