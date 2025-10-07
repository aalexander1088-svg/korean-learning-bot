import { google } from 'googleapis';
import * as dotenv from 'dotenv';

dotenv.config();

export interface GoogleDocContent {
  text: string;
  lastModified: Date;
  wordCount: number;
}

export class GoogleDocsService {
  private docs: any;
  private drive: any;

  constructor() {
    // Initialize Google APIs
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: [
        'https://www.googleapis.com/auth/documents.readonly',
        'https://www.googleapis.com/auth/drive.readonly'
      ]
    });

    this.docs = google.docs({ version: 'v1', auth });
    this.drive = google.drive({ version: 'v3', auth });
  }

  public async getDocumentContent(documentId: string): Promise<GoogleDocContent> {
    try {
      console.log(`📄 Fetching Google Doc: ${documentId}`);

      // Get document content
      const doc = await this.docs.documents.get({
        documentId: documentId
      });

      // Get document metadata
      const fileInfo = await this.drive.files.get({
        fileId: documentId,
        fields: 'modifiedTime'
      });

      // Extract text content
      const text = this.extractTextFromDocument(doc.data);
      
      // Count words
      const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;

      console.log(`✅ Successfully fetched Google Doc: ${wordCount} words`);

      return {
        text,
        lastModified: new Date(fileInfo.data.modifiedTime || ''),
        wordCount
      };

    } catch (error) {
      console.error('❌ Error fetching Google Doc:', error);
      throw error;
    }
  }

  public async getRecentVocabulary(documentId: string, linesFromBottom: number = 50): Promise<string> {
    try {
      const content = await this.getDocumentContent(documentId);
      
      // Split into lines and get the last N lines
      const lines = content.text.split('\n').filter(line => line.trim().length > 0);
      const recentLines = lines.slice(-linesFromBottom);
      
      console.log(`📚 Extracted ${recentLines.length} recent lines from Google Doc`);
      
      return recentLines.join('\n');

    } catch (error) {
      console.error('❌ Error getting recent vocabulary:', error);
      throw error;
    }
  }

  private extractTextFromDocument(doc: any): string {
    let text = '';
    
    if (doc.body && doc.body.content) {
      for (const element of doc.body.content) {
        if (element.paragraph) {
          for (const textElement of element.paragraph.elements || []) {
            if (textElement.textRun) {
              text += textElement.textRun.content;
            }
          }
        }
      }
    }
    
    return text;
  }

  public async testConnection(): Promise<boolean> {
    try {
      // Test with a simple API call
      await this.drive.files.list({ pageSize: 1 });
      console.log('✅ Google Docs API connection successful');
      return true;
    } catch (error) {
      console.error('❌ Google Docs API connection failed:', error);
      return false;
    }
  }
}



