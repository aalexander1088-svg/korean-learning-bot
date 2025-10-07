#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { NewsEmailBot } from './news-email-bot';

// Load environment variables
dotenv.config();

class NewsBotRunner {
  private newsBot: NewsEmailBot;

  constructor() {
    this.newsBot = new NewsEmailBot();
  }

  public async run(): Promise<void> {
    try {
      console.log('🤖 News Email Bot Starting...');
      
      // Test email connection first
      const connectionOk = await this.newsBot.testConnection();
      if (!connectionOk) {
        console.error('❌ Email connection failed. Please check your email configuration.');
        process.exit(1);
      }

      // Check command line arguments
      const args = process.argv.slice(2);
      
      if (args.includes('--help') || args.includes('-h')) {
        this.showHelp();
        return;
      }

      if (args.includes('--sources')) {
        this.showAvailableSources();
        return;
      }

      // Check if specific source is requested
      const sourceIndex = args.indexOf('--source');
      if (sourceIndex !== -1 && sourceIndex + 1 < args.length) {
        const sourceName = args[sourceIndex + 1];
        console.log(`📰 Sending news digest for ${sourceName}...`);
        await this.newsBot.sendNewsDigestForSource(sourceName);
      } else {
        // Send full news digest
        console.log('📰 Sending full news digest...');
        await this.newsBot.sendNewsDigest();
      }

      console.log('✅ News bot completed successfully!');

    } catch (error) {
      console.error('❌ News bot failed:', error);
      process.exit(1);
    }
  }

  private showHelp(): void {
    console.log(`
📰 News Email Bot - Help

Usage:
  npm run news-bot                    # Send full news digest
  npm run news-bot -- --source "Zero Hedge"  # Send digest for specific source
  npm run news-bot -- --sources      # Show available sources
  npm run news-bot -- --help         # Show this help

Available Sources:
${this.newsBot.getAvailableSources().map(source => `  - ${source}`).join('\n')}

Environment Variables:
  EMAIL_USER          - Your email address
  EMAIL_PASSWORD      - Your email app password
  DEFAULT_EMAIL       - Default recipient email
  NEWS_RECIPIENT_EMAIL - Specific recipient for news digests

Examples:
  npm run news-bot
  npm run news-bot -- --source "Korea Times"
  npm run news-bot -- --sources
    `);
  }

  private showAvailableSources(): void {
    console.log('📰 Available News Sources:');
    this.newsBot.getAvailableSources().forEach((source, index) => {
      console.log(`  ${index + 1}. ${source}`);
    });
  }
}

// Run the news bot
const runner = new NewsBotRunner();
runner.run().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

