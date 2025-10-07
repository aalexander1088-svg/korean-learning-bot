# News Email Bot

A powerful email bot that scrapes headlines from your favorite news websites and sends you a daily digest email.

## Features

- 📰 **Multi-source scraping**: Supports Zero Hedge, VT Foreign Policy, and Korea Times
- 📧 **Beautiful email formatting**: HTML and plain text email formats
- ⏰ **Scheduled delivery**: Automatic daily emails at 7:00 AM
- 🎯 **Flexible configuration**: Customize sources, headlines per source, and recipients
- 🔧 **Easy to use**: Simple command-line interface

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Copy `env-template.txt` to `.env` and configure:
   ```bash
   cp env-template.txt .env
   ```
   
   Edit `.env` with your email credentials:
   ```
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   DEFAULT_EMAIL=recipient@gmail.com
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

4. **Run the news bot**:
   ```bash
   # Send full news digest
   npm run news-bot
   
   # Send digest for specific source
   npm run news-bot -- --source "Zero Hedge"
   
   # Show available sources
   npm run news-bot -- --sources
   
   # Show help
   npm run news-bot -- --help
   ```

## Scheduled Operation

The news bot is integrated with the scheduler and will automatically send daily news digests at 7:00 AM:

```bash
# Start the scheduler (includes news bot)
npm run schedule

# Test news bot immediately
npm run schedule -- --news
```

## Configuration

### Environment Variables

- `EMAIL_USER`: Your email address for sending
- `EMAIL_PASSWORD`: Your email app password
- `DEFAULT_EMAIL`: Default recipient email
- `NEWS_RECIPIENT_EMAIL`: Specific recipient for news digests
- `EMAIL_HOST`: SMTP host (default: smtp.gmail.com)
- `EMAIL_PORT`: SMTP port (default: 587)

### Available Sources

- **Zero Hedge**: Financial and geopolitical news
- **VT Foreign Policy**: Foreign policy analysis
- **Korea Times**: Korean news and current events

## Email Format

The bot sends beautifully formatted emails with:

- 📊 Summary statistics (total headlines, sources)
- 📰 Headlines grouped by source
- 🔗 Clickable links to full articles
- ⏰ Timestamps for when articles were scraped
- 📱 Mobile-friendly responsive design

## Customization

### Adding New Sources

You can easily add new news sources by modifying the `NewsScraper` class in `src/news-scraper.ts`:

```typescript
{
  name: 'Your News Site',
  url: 'https://yournewsite.com',
  selectors: {
    headline: 'h2 a, h3 a',
    link: 'a',
    container: 'article'
  },
  maxHeadlines: 5
}
```

### Customizing Email Content

Modify the email templates in `src/news-email-bot.ts` to customize the appearance and content of your news digests.

## Troubleshooting

### Email Issues
- Ensure you're using an app password for Gmail (not your regular password)
- Check that your email credentials are correct in `.env`
- Verify SMTP settings match your email provider

### Scraping Issues
- Some websites may block automated requests
- Check if the website structure has changed (selectors may need updating)
- The bot includes delays between requests to be respectful

### Build Issues
- Run `npm install` to ensure all dependencies are installed
- Check TypeScript compilation with `npm run build`

## Examples

```bash
# Send news digest immediately
npm run news-bot

# Send only Korea Times headlines
npm run news-bot -- --source "Korea Times"

# Show all available sources
npm run news-bot -- --sources

# Start scheduler with news bot
npm run schedule

# Test news bot with scheduler
npm run schedule -- --news
```

## Support

For issues or questions, check the console output for detailed error messages. The bot provides comprehensive logging to help diagnose any problems.

