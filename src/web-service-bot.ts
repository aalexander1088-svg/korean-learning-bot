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
      
      if (!process.env.TELEGRAM_BOT_TOKEN) {
        throw new Error('TELEGRAM_BOT_TOKEN environment variable is required.');
      }

      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is required.');
      }

      // Start the Telegram bot immediately
      console.log('🤖 Starting Telegram bot...');
      await this.bot.start();
      console.log('✅ Telegram bot started successfully');
      
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
      
    } catch (error) {
      console.error('❌ Failed to start Korean Telegram Bot Web Service:', error);
      console.error('💡 This might be due to another bot instance still running.');
      console.error('💡 Please check:');
      console.error('   • All Render services are stopped');
      console.error('   • No local bot processes running');
      console.error('   • Wait 5 minutes before retrying');
      process.exit(1);
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
