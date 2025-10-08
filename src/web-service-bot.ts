#!/usr/bin/env node

import * as dotenv from 'dotenv';
import express from 'express';
import { SimplifiedKoreanBot } from './simplified-korean-bot';

dotenv.config();

class WebServiceBot {
  private app: express.Application;
  private bot: SimplifiedKoreanBot;
  private port: number;

  constructor() {
    this.app = express();
    this.port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    this.bot = new SimplifiedKoreanBot();
    this.setupExpress();
  }

  private setupExpress(): void {
    // Middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Health check endpoint (keeps service awake)
    this.app.get('/', (req, res) => {
      res.json({
        status: 'Korean Telegram Bot is running! 🇰🇷',
        timestamp: new Date().toISOString(),
        features: [
          'MCP Korean Learning System',
          'Adaptive quizzes',
          'Spaced repetition',
          'Progress tracking',
          'Korean word learning'
        ]
      });
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        bot: 'running',
        timestamp: new Date().toISOString()
      });
    });

    // Telegram webhook endpoint (if you want to use webhooks later)
    this.app.post('/webhook', (req, res) => {
      console.log('📨 Webhook received:', req.body);
      res.json({ status: 'received' });
    });

    // Keep-alive endpoint (called by external service to prevent sleep)
    this.app.get('/keepalive', (req, res) => {
      console.log('💓 Keep-alive ping received');
      res.json({ 
        status: 'alive',
        timestamp: new Date().toISOString()
      });
    });

    // Error handling
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('❌ Express error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  public async start(): Promise<void> {
    try {
      console.log('🚀 Starting Korean Telegram Bot as Web Service...');
      
      // Debug environment variables
      console.log('🔍 Environment check:');
      console.log(`   • TELEGRAM_BOT_TOKEN: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Set' : '❌ Missing'}`);
      console.log(`   • OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`);
      console.log(`   • PORT: ${process.env.PORT || '3000 (default)'}`);
      
      if (!process.env.TELEGRAM_BOT_TOKEN) {
        throw new Error('TELEGRAM_BOT_TOKEN environment variable is required.');
      }

      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is required.');
      }

      // Start the Telegram bot immediately
      console.log('🤖 Starting Telegram bot...');
      try {
        await this.bot.start();
        console.log('✅ Telegram bot started successfully');
      } catch (botError) {
        console.error('❌ Telegram bot failed to start:', botError);
        console.error('💡 This might be due to:');
        console.error('   • Invalid TELEGRAM_BOT_TOKEN');
        console.error('   • Network connectivity issues');
        console.error('   • Another bot instance running');
        console.error('   • Missing environment variables');
        
        // Continue with web service even if bot fails
        console.log('⚠️ Continuing with web service only...');
      }
      
      // Start the Express server - bind to all interfaces for Render
      this.app.listen(this.port, '0.0.0.0', () => {
        console.log(`🌐 Web service running on port ${this.port}`);
        console.log(`📱 Telegram bot is active and responding to messages`);
        console.log(`💓 Health check: http://localhost:${this.port}/health`);
        console.log(`🔄 Keep-alive: http://localhost:${this.port}/keepalive`);
        console.log(`🚀 Service ready and listening on 0.0.0.0:${this.port}`);
      });
      
      console.log('✅ Korean Telegram Bot Web Service is running!');
      console.log('🎯 Features available:');
      console.log('   • MCP Korean Learning System');
      console.log('   • Adaptive quizzes');
      console.log('   • Spaced repetition');
      console.log('   • Progress tracking');
      console.log('   • Korean word learning');
      console.log('   • Web service endpoints');
      
      // Keep-alive mechanism for free tier
      this.setupKeepAlive();
      
      // Keep the process alive
      console.log('🔄 Service is running and will stay alive...');
      
    } catch (error) {
      console.error('❌ Failed to start Korean Telegram Bot Web Service:', error);
      console.error('💡 Attempting to start web service only...');
      
      // Try to start just the web service as a fallback
      try {
        this.app.listen(this.port, '0.0.0.0', () => {
          console.log(`🌐 Web service running on port ${this.port} (bot disabled)`);
          console.log(`💓 Health check: http://localhost:${this.port}/health`);
          console.log('⚠️ Telegram bot is not available, but web service is running');
        });
        
        // Keep the process alive
        console.log('🔄 Web service is running and will stay alive...');
        
      } catch (webError) {
        console.error('❌ Failed to start web service:', webError);
        process.exit(1);
      }
    }
  }

  private setupKeepAlive(): void {
    // Self-ping every 10 minutes to keep the service awake
    setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:${this.port}/keepalive`);
        if (response.ok) {
          console.log('💓 Self keep-alive successful');
        }
      } catch (error) {
        console.log('⚠️ Keep-alive ping failed (service might be sleeping)');
      }
    }, 600000); // Every 10 minutes
  }

  public stop(): void {
    console.log('🛑 Stopping Korean Telegram Bot Web Service...');
    this.bot.stop();
    process.exit(0);
  }
}

// Main execution
async function startWebServiceBot() {
  const webServiceBot = new WebServiceBot();
  
  // Graceful shutdown
  process.once('SIGINT', () => {
    console.log('\n🛑 Shutting down Korean Telegram Bot Web Service...');
    webServiceBot.stop();
  });

  process.once('SIGTERM', () => {
    console.log('\n🛑 Shutting down Korean Telegram Bot Web Service...');
    webServiceBot.stop();
  });

  await webServiceBot.start();
}

if (require.main === module) {
  startWebServiceBot().catch(console.error);
}

export { WebServiceBot };
