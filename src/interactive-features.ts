import * as cron from 'node-cron';
import { KoreanDatabase } from './database';
import { IntelligentLearningSystem } from './intelligent-learning';
import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

dotenv.config();

interface SmartNotification {
  id: string;
  type: 'reminder' | 'encouragement' | 'challenge' | 'achievement';
  message: string;
  action?: string;
  priority: 'low' | 'medium' | 'high';
  scheduledTime: Date;
}

interface UserPreferences {
  notificationFrequency: 'low' | 'medium' | 'high';
  preferredStudyTimes: string[];
  learningGoals: string[];
  difficultyPreference: 'Easy' | 'Medium' | 'Hard';
}

export class InteractiveLearningFeatures {
  private database: KoreanDatabase;
  private learningSystem: IntelligentLearningSystem;
  private transporter!: nodemailer.Transporter;
  private userPreferences: UserPreferences;
  private notifications: SmartNotification[];

  constructor() {
    this.database = new KoreanDatabase();
    this.learningSystem = new IntelligentLearningSystem();
    this.userPreferences = {
      notificationFrequency: 'medium',
      preferredStudyTimes: ['7:00', '14:00', '19:00'],
      learningGoals: ['vocabulary', 'conversation', 'grammar'],
      difficultyPreference: 'Medium'
    };
    this.notifications = [];
    
    this.initializeEmailTransporter();
    this.setupSmartNotifications();
  }

  private initializeEmailTransporter(): void {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  private setupSmartNotifications(): void {
    console.log('🔔 Setting up smart notifications...');
    
    // Morning motivation (7 AM)
    cron.schedule('0 7 * * *', () => {
      this.sendMorningMotivation();
    });

    // Afternoon check-in (2 PM)
    cron.schedule('0 14 * * *', () => {
      this.sendAfternoonCheckIn();
    });

    // Evening review reminder (7 PM)
    cron.schedule('0 19 * * *', () => {
      this.sendEveningReviewReminder();
    });

    // Weekly progress report (Sunday 6 PM)
    cron.schedule('0 18 * * 0', () => {
      this.sendWeeklyProgressReport();
    });

    console.log('✅ Smart notifications scheduled');
  }

  private async sendMorningMotivation(): Promise<void> {
    try {
      const analytics = await this.learningSystem.analyzeLearningPatterns();
      const studyPlan = await this.learningSystem.generatePersonalizedStudyPlan();
      
      const motivationMessages = [
        `Good morning! 🌅 Ready to learn some Korean today?`,
        `새벽이에요! Let's start your Korean learning journey! 🌅`,
        `Good morning! Your Korean vocabulary is waiting! 📚`,
        `아침이에요! Time for Korean practice! ☀️`
      ];
      
      const randomMessage = motivationMessages[Math.floor(Math.random() * motivationMessages.length)];
      
      const emailContent = `
        <h2>${randomMessage}</h2>
        <p><strong>Today's Goal:</strong> ${studyPlan.dailyGoal}</p>
        <p><strong>Focus Areas:</strong> ${studyPlan.focusAreas.join(', ')}</p>
        <p><strong>Your Progress:</strong> ${analytics.vocabularyLearned} words learned, ${analytics.retentionRate.toFixed(1)}% retention rate</p>
        
        <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>💡 Quick Korean Tip</h3>
          <p>Try using Korean words in your daily thoughts today!</p>
        </div>
        
        <p>Ready to practice? Run: <code>npm run ai-practice</code></p>
      `;
      
      await this.sendNotificationEmail('Korean Learning Motivation', emailContent);
      console.log('📧 Morning motivation sent');
    } catch (error) {
      console.error('Error sending morning motivation:', error);
    }
  }

  private async sendAfternoonCheckIn(): Promise<void> {
    try {
      const checkInMessages = [
        `How's your Korean learning going today? 🤔`,
        `오후에요! Ready for a quick Korean practice? 🌤️`,
        `Afternoon check-in! How many Korean words did you learn today? 📝`,
        `점심 먹었어요? Time for Korean practice! 🍽️`
      ];
      
      const randomMessage = checkInMessages[Math.floor(Math.random() * checkInMessages.length)];
      
      const emailContent = `
        <h2>${randomMessage}</h2>
        <p>Take a quick 5-minute break to practice Korean!</p>
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>⚡ Quick Practice Ideas</h3>
          <ul>
            <li>Review 3 words from yesterday</li>
            <li>Practice saying "안녕하세요" to yourself</li>
            <li>Count to 10 in Korean</li>
          </ul>
        </div>
        
        <p>Ready for conversation practice? Run: <code>npm run ai-practice</code></p>
      `;
      
      await this.sendNotificationEmail('Korean Learning Check-in', emailContent);
      console.log('📧 Afternoon check-in sent');
    } catch (error) {
      console.error('Error sending afternoon check-in:', error);
    }
  }

  private async sendEveningReviewReminder(): Promise<void> {
    try {
      const reviewMessages = [
        `Evening review time! 📚`,
        `저녁이에요! Time to review what you learned today! 🌙`,
        `End your day with Korean practice! 🌟`,
        `오늘 배운 한국어 복습해요! 📖`
      ];
      
      const randomMessage = reviewMessages[Math.floor(Math.random() * reviewMessages.length)];
      
      const emailContent = `
        <h2>${randomMessage}</h2>
        <p>Perfect time to review and reinforce what you learned today!</p>
        
        <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>📝 Evening Review Checklist</h3>
          <ul>
            <li>Review today's vocabulary</li>
            <li>Practice pronunciation</li>
            <li>Try using new words in sentences</li>
            <li>Plan tomorrow's learning goals</li>
          </ul>
        </div>
        
        <p>Start your review: <code>npm run review</code></p>
      `;
      
      await this.sendNotificationEmail('Korean Learning Evening Review', emailContent);
      console.log('📧 Evening review reminder sent');
    } catch (error) {
      console.error('Error sending evening review reminder:', error);
    }
  }

  private async sendWeeklyProgressReport(): Promise<void> {
    try {
      const progressReport = await this.learningSystem.generateProgressReport();
      
      const emailContent = `
        <h2>📊 Weekly Korean Learning Report</h2>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
          <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${progressReport}</pre>
        </div>
        
        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>🎯 Next Week's Focus</h3>
          <p>Keep up the great work! Your Korean is improving every day!</p>
        </div>
      `;
      
      await this.sendNotificationEmail('Weekly Korean Learning Report', emailContent);
      console.log('📧 Weekly progress report sent');
    } catch (error) {
      console.error('Error sending weekly progress report:', error);
    }
  }

  private async sendNotificationEmail(subject: string, content: string): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.DEFAULT_EMAIL || 'aalexander1088@gmail.com',
        subject: `Korean Learning: ${subject}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              h2 { color: #2c3e50; }
              code { background-color: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
            </style>
          </head>
          <body>
            <div class="container">
              ${content}
              <hr style="margin: 30px 0;">
              <p style="color: #666; font-size: 0.9em;">
                This is an automated message from your Korean Learning AI Assistant. 
                화이팅! 💪
              </p>
            </div>
          </body>
          </html>
        `,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending notification email:', error);
    }
  }

  async createCustomNotification(type: string, message: string, scheduledTime?: Date): Promise<void> {
    const notification: SmartNotification = {
      id: `custom_${Date.now()}`,
      type: type as any,
      message,
      priority: 'medium',
      scheduledTime: scheduledTime || new Date(Date.now() + 60000) // 1 minute from now
    };
    
    this.notifications.push(notification);
    
    // Schedule the notification
    if (scheduledTime) {
      const cronExpression = this.dateToCron(scheduledTime);
      cron.schedule(cronExpression, () => {
        this.sendCustomNotification(notification);
      });
    }
    
    console.log(`✅ Custom notification scheduled: ${message}`);
  }

  private dateToCron(date: Date): string {
    const minute = date.getMinutes();
    const hour = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    
    return `${minute} ${hour} ${day} ${month} *`;
  }

  private async sendCustomNotification(notification: SmartNotification): Promise<void> {
    const emailContent = `
      <h2>🔔 Custom Korean Learning Notification</h2>
      <p><strong>Type:</strong> ${notification.type}</p>
      <p><strong>Message:</strong> ${notification.message}</p>
      <p><strong>Priority:</strong> ${notification.priority}</p>
    `;
    
    await this.sendNotificationEmail('Custom Notification', emailContent);
  }

  async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<void> {
    this.userPreferences = { ...this.userPreferences, ...preferences };
    console.log('✅ User preferences updated');
  }

  async getLearningStreak(): Promise<number> {
    // Calculate consecutive days of learning
    const vocabulary = await this.database.getAllVocabulary();
    const dates = vocabulary.map(word => word.dateAdded).sort();
    
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let currentDate = new Date(today);
    
    for (let i = dates.length - 1; i >= 0; i--) {
      const wordDate = dates[i];
      const expectedDate = currentDate.toISOString().split('T')[0];
      
      if (wordDate === expectedDate) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  }

  async sendAchievementNotification(achievement: string): Promise<void> {
    const emailContent = `
      <h2>🏆 Korean Learning Achievement!</h2>
      <div style="background-color: #d4edda; padding: 20px; border-radius: 10px; text-align: center;">
        <h3>${achievement}</h3>
        <p>Congratulations! You're making great progress in your Korean learning journey!</p>
      </div>
      <p>Keep up the excellent work! 화이팅! 💪</p>
    `;
    
    await this.sendNotificationEmail('Achievement Unlocked!', emailContent);
    console.log(`🏆 Achievement notification sent: ${achievement}`);
  }

  close(): void {
    this.database.close();
    this.learningSystem.close();
  }
}

// Start the interactive features
const interactiveFeatures = new InteractiveLearningFeatures();

// Keep the process running
process.on('SIGINT', () => {
  console.log('\n👋 Stopping Interactive Learning Features...');
  interactiveFeatures.close();
  process.exit(0);
});

console.log('🚀 Interactive Learning Features started!');
console.log('📧 Smart notifications will be sent at:');
console.log('   • 7:00 AM - Morning motivation');
console.log('   • 2:00 PM - Afternoon check-in');
console.log('   • 7:00 PM - Evening review reminder');
console.log('   • Sunday 6:00 PM - Weekly progress report');
console.log('💡 Use Ctrl+C to stop');
