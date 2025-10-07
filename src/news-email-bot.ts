import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import { NewsScraper, NewsHeadline } from './news-scraper';

dotenv.config();

export class NewsEmailBot {
  private transporter: nodemailer.Transporter;
  private scraper: NewsScraper;

  constructor() {
    this.scraper = new NewsScraper();
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    console.log('📧 News Email Bot initialized');
  }

  private generateHTMLEmail(headlines: NewsHeadline[]): string {
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Group headlines by source
    const headlinesBySource = headlines.reduce((acc, headline) => {
      if (!acc[headline.source]) {
        acc[headline.source] = [];
      }
      acc[headline.source].push(headline);
      return acc;
    }, {} as Record<string, NewsHeadline[]>);

    let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Daily News Digest - ${currentDate}</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 10px;
                text-align: center;
                margin-bottom: 30px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 300;
            }
            .header p {
                margin: 10px 0 0 0;
                opacity: 0.9;
                font-size: 16px;
            }
            .source-section {
                background: white;
                margin-bottom: 25px;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .source-header {
                background: #495057;
                color: white;
                padding: 15px 20px;
                font-weight: 600;
                font-size: 18px;
            }
            .headlines-list {
                padding: 0;
                margin: 0;
            }
            .headline-item {
                padding: 20px;
                border-bottom: 1px solid #e9ecef;
                transition: background-color 0.2s ease;
            }
            .headline-item:hover {
                background-color: #f8f9fa;
            }
            .headline-item:last-child {
                border-bottom: none;
            }
            .headline-title {
                font-size: 16px;
                font-weight: 500;
                margin-bottom: 8px;
                color: #2c3e50;
            }
            .headline-link {
                color: #007bff;
                text-decoration: none;
                font-size: 14px;
                word-break: break-all;
            }
            .headline-link:hover {
                text-decoration: underline;
            }
            .timestamp {
                color: #6c757d;
                font-size: 12px;
                margin-top: 5px;
            }
            .footer {
                text-align: center;
                margin-top: 40px;
                padding: 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .footer p {
                margin: 0;
                color: #6c757d;
                font-size: 14px;
            }
            .stats {
                background: #e3f2fd;
                padding: 15px;
                border-radius: 6px;
                margin-bottom: 20px;
                text-align: center;
            }
            .stats-text {
                margin: 0;
                color: #1976d2;
                font-weight: 500;
            }
            .quick-links {
                margin-top: 20px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 6px;
                border-left: 4px solid #007bff;
            }
            .quick-links h3 {
                margin: 0 0 10px 0;
                color: #495057;
                font-size: 16px;
            }
            .quick-links ul {
                margin: 0;
                padding: 0;
                list-style: none;
            }
            .quick-links li {
                margin: 8px 0;
            }
            .quick-links a {
                color: #007bff;
                text-decoration: none;
                font-weight: 500;
            }
            .quick-links a:hover {
                text-decoration: underline;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>📰 Daily News Digest</h1>
            <p>${currentDate}</p>
        </div>

        <div class="stats">
            <p class="stats-text">📊 Total Headlines: ${headlines.length} | Sources: ${Object.keys(headlinesBySource).length}</p>
        </div>
    `;

    // Add headlines grouped by source
    Object.entries(headlinesBySource).forEach(([sourceName, sourceHeadlines]) => {
      htmlContent += `
        <div class="source-section">
            <div class="source-header">
                📰 ${sourceName} (${sourceHeadlines.length} headlines)
            </div>
            <ul class="headlines-list">
      `;

      sourceHeadlines.forEach(headline => {
        htmlContent += `
                <li class="headline-item">
                    <div class="headline-title">${headline.title}</div>
                    <a href="${headline.url}" class="headline-link" target="_blank">${headline.url}</a>
                    <div class="timestamp">Scraped: ${headline.timestamp?.toLocaleString() || 'Unknown'}</div>
                </li>
        `;
      });

      htmlContent += `
            </ul>
        </div>
      `;
    });

    htmlContent += `
        <div class="footer">
            <p>🤖 Generated by News Email Bot</p>
            <p>Sources: ${Object.keys(headlinesBySource).join(', ')}</p>
            
            <div class="quick-links">
                <h3>🔗 Quick Links to News Sources</h3>
                <ul>
                    <li><a href="https://www.zerohedge.com" target="_blank">📰 Zero Hedge</a></li>
                    <li><a href="https://www.vtforeignpolicy.com" target="_blank">📰 VT Foreign Policy</a></li>
                    <li><a href="https://www.koreatimes.co.kr/economy" target="_blank">📰 Korea Times Economy</a></li>
                </ul>
            </div>
        </div>
    </body>
    </html>
    `;

    return htmlContent;
  }

  private generatePlainTextEmail(headlines: NewsHeadline[]): string {
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Group headlines by source
    const headlinesBySource = headlines.reduce((acc, headline) => {
      if (!acc[headline.source]) {
        acc[headline.source] = [];
      }
      acc[headline.source].push(headline);
      return acc;
    }, {} as Record<string, NewsHeadline[]>);

    let textContent = `📰 DAILY NEWS DIGEST - ${currentDate}\n`;
    textContent += `========================================\n\n`;
    textContent += `📊 Total Headlines: ${headlines.length} | Sources: ${Object.keys(headlinesBySource).length}\n\n`;

    Object.entries(headlinesBySource).forEach(([sourceName, sourceHeadlines]) => {
      textContent += `📰 ${sourceName.toUpperCase()} (${sourceHeadlines.length} headlines)\n`;
      textContent += `${'='.repeat(sourceName.length + 20)}\n\n`;

      sourceHeadlines.forEach((headline, index) => {
        textContent += `${index + 1}. ${headline.title}\n`;
        textContent += `   🔗 ${headline.url}\n`;
        textContent += `   ⏰ ${headline.timestamp?.toLocaleString() || 'Unknown'}\n\n`;
      });

      textContent += '\n';
    });

    textContent += `🤖 Generated by News Email Bot\n`;
    textContent += `Sources: ${Object.keys(headlinesBySource).join(', ')}\n\n`;
    
    textContent += `🔗 QUICK LINKS TO NEWS SOURCES:\n`;
    textContent += `📰 Zero Hedge: https://www.zerohedge.com\n`;
    textContent += `📰 VT Foreign Policy: https://www.vtforeignpolicy.com\n`;
    textContent += `📰 Korea Times Economy: https://www.koreatimes.co.kr/economy\n`;

    return textContent;
  }

  public async sendNewsDigest(recipientEmail?: string): Promise<void> {
    try {
      console.log('🔍 Scraping news headlines...');
      const headlines = await this.scraper.scrapeAllSources();

      if (headlines.length === 0) {
        console.log('❌ No headlines found to send');
        return;
      }

      const recipient = recipientEmail || process.env.NEWS_RECIPIENT_EMAIL || process.env.DEFAULT_EMAIL || 'aalexander1088@gmail.com';
      if (!recipient) {
        throw new Error('No recipient email specified');
      }

      const htmlContent = this.generateHTMLEmail(headlines);
      const textContent = this.generatePlainTextEmail(headlines);

      const mailOptions = {
        from: `"News Bot" <${process.env.EMAIL_USER}>`,
        to: recipient,
        subject: `📰 Daily News Digest - ${new Date().toLocaleDateString()}`,
        text: textContent,
        html: htmlContent
      };

      console.log(`📧 Sending news digest to ${recipient}...`);
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ News digest sent successfully!');
      console.log(`📧 Message ID: ${info.messageId}`);
      console.log(`📊 Sent ${headlines.length} headlines from ${new Set(headlines.map(h => h.source)).size} sources`);

    } catch (error) {
      console.error('❌ Error sending news digest:', error);
      throw error;
    }
  }

  public async sendNewsDigestForSource(sourceName: string, recipientEmail?: string): Promise<void> {
    try {
      console.log(`🔍 Scraping headlines from ${sourceName}...`);
      const headlines = await this.scraper.scrapeSource(sourceName);

      if (headlines.length === 0) {
        console.log(`❌ No headlines found from ${sourceName}`);
        return;
      }

      const recipient = recipientEmail || process.env.NEWS_RECIPIENT_EMAIL || process.env.DEFAULT_EMAIL || 'aalexander1088@gmail.com';
      if (!recipient) {
        throw new Error('No recipient email specified');
      }

      const htmlContent = this.generateHTMLEmail(headlines);
      const textContent = this.generatePlainTextEmail(headlines);

      const mailOptions = {
        from: `"News Bot" <${process.env.EMAIL_USER}>`,
        to: recipient,
        subject: `📰 ${sourceName} News Digest - ${new Date().toLocaleDateString()}`,
        text: textContent,
        html: htmlContent
      };

      console.log(`📧 Sending ${sourceName} news digest to ${recipient}...`);
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ ${sourceName} news digest sent successfully!`);
      console.log(`📧 Message ID: ${info.messageId}`);
      console.log(`📊 Sent ${headlines.length} headlines from ${sourceName}`);

    } catch (error) {
      console.error(`❌ Error sending ${sourceName} news digest:`, error);
      throw error;
    }
  }

  public getAvailableSources(): string[] {
    return this.scraper.getAvailableSources();
  }

  public async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email connection failed:', error);
      return false;
    }
  }
}
