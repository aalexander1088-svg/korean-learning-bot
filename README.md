# Outdoor Job Scraper for Tampa Bay Area

A Python script that searches for outdoor and nature-related jobs in the Tampa/St. Petersburg area and emails you a formatted summary via Gmail.

## Features

- 🔍 **Multi-Source Search**: Searches Indeed.com and local park websites
- 📧 **Gmail Integration**: Sends beautifully formatted HTML emails
- 📱 **Mobile-Friendly**: Email templates optimized for mobile viewing
- 💾 **Data Backup**: Saves job listings to JSON files
- 🛡️ **Rate Limiting**: Respectful scraping with delays and retry logic
- 📊 **Detailed Logging**: Comprehensive logging for debugging

## Job Sources

- **Indeed.com**: Park ranger, outdoor, nature, environmental jobs
- **Hillsborough County Parks**: County recreation positions
- **Pinellas County Parks**: County recreation positions  
- **Tampa Parks & Recreation**: City recreation positions
- **St. Petersburg Parks & Recreation**: City recreation positions
- **Florida State Parks**: State park positions in Tampa Bay area

## Prerequisites

- Python 3.7 or higher
- Gmail account with API access enabled
- Google Cloud Console project with Gmail API enabled

## Installation

1. **Clone or download the script files:**
   ```bash
   # Create a new directory for the project
   mkdir outdoor-job-scraper
   cd outdoor-job-scraper
   
   # Copy all the script files to this directory
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up Gmail API credentials:**

   ### Step 1: Create Google Cloud Project
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Gmail API:
     - Go to "APIs & Services" > "Library"
     - Search for "Gmail API" and enable it

   ### Step 2: Create OAuth 2.0 Credentials
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Desktop application" as the application type
   - Download the credentials file and rename it to `credentials.json`
   - Place `credentials.json` in the same directory as the script

4. **Configure your email address:**
   
   **Option A: Environment Variable (Recommended)**
   ```bash
   # Windows (Command Prompt)
   set EMAIL_ADDRESS=your.email@gmail.com
   
   # Windows (PowerShell)
   $env:EMAIL_ADDRESS="your.email@gmail.com"
   
   # Linux/Mac
   export EMAIL_ADDRESS=your.email@gmail.com
   ```
   
   **Option B: Copy and edit env.example**
   ```bash
   # Copy the example file
   cp env.example .env
   
   # Edit .env and add your email address
   EMAIL_ADDRESS=your.email@gmail.com
   ```

## Usage

### Basic Usage
```bash
python outdoor_job_scraper.py
```

### First Run (Authentication)
On the first run, the script will:
1. Open your web browser for Gmail authentication
2. Ask you to sign in to your Google account
3. Request permission to send emails on your behalf
4. Save authentication tokens for future runs

### Automated Scheduling (Optional)
You can set up the script to run automatically:

**Windows Task Scheduler:**
```batch
# Create a batch file (run_scraper.bat)
@echo off
cd /d "C:\path\to\outdoor-job-scraper"
set EMAIL_ADDRESS=your.email@gmail.com
python outdoor_job_scraper.py
```

**Linux/Mac Cron:**
```bash
# Add to crontab (run daily at 9 AM)
0 9 * * * cd /path/to/outdoor-job-scraper && EMAIL_ADDRESS=your.email@gmail.com python outdoor_job_scraper.py
```

## Output

### Email Format
The script sends a mobile-friendly HTML email with:
- **Header**: Job search summary with total count
- **Grouped Listings**: Jobs organized by source (Indeed, County Parks, etc.)
- **Job Details**: Title, company, location, description, apply link
- **Responsive Design**: Optimized for both desktop and mobile viewing

### JSON Backup
Job data is automatically saved to timestamped JSON files:
```
outdoor_jobs_20231201_143022.json
```

### Logging
Detailed logs are saved to `job_scraper.log` and displayed in the console.

## File Structure

```
outdoor-job-scraper/
├── outdoor_job_scraper.py    # Main script
├── requirements.txt          # Python dependencies
├── env.example              # Environment variables template
├── README.md                # This file
├── credentials.json         # Gmail API credentials (you provide)
├── token.json              # Gmail auth tokens (auto-generated)
├── job_scraper.log         # Log file (auto-generated)
└── outdoor_jobs_*.json     # Job data backups (auto-generated)
```

## Configuration Options

### Environment Variables
- `EMAIL_ADDRESS`: Your email address (required)
- `CREDENTIALS_FILE`: Path to Gmail credentials file (default: credentials.json)
- `TOKEN_FILE`: Path to Gmail token file (default: token.json)
- `REQUEST_DELAY`: Delay between requests in seconds (default: 1.0)
- `MAX_RETRIES`: Maximum retry attempts for failed requests (default: 3)
- `LOG_LEVEL`: Logging level (default: INFO)

### Customizing Job Search
Edit the script to modify:
- Search keywords in `scrape_indeed()` method
- Location radius in Indeed search parameters
- Additional job sources in `scrape_county_parks()` method

## Troubleshooting

### Common Issues

**1. "Credentials file not found"**
- Ensure `credentials.json` is in the same directory as the script
- Verify the file was downloaded from Google Cloud Console

**2. "Authentication failed"**
- Delete `token.json` and run the script again
- Ensure Gmail API is enabled in your Google Cloud project
- Check that your OAuth consent screen is configured

**3. "No jobs found"**
- Check your internet connection
- Verify the target websites are accessible
- Review the log file for specific error messages

**4. "Email not sent"**
- Verify your email address is correct
- Check that you have permission to send emails from the authenticated account
- Review Gmail API quotas and limits

### Rate Limiting
If you encounter rate limiting:
- Increase the `REQUEST_DELAY` value
- Reduce the number of pages scraped
- Run the script less frequently

### Website Changes
If websites change their structure:
- The script includes error handling and will continue with other sources
- Check the log file for specific parsing errors
- Update the parsing logic in the respective scraping methods

## Legal and Ethical Considerations

- **Respectful Scraping**: The script includes delays and rate limiting
- **Terms of Service**: Ensure compliance with each website's terms of service
- **Personal Use**: This tool is intended for personal job searching
- **Data Usage**: Job data is only used for email summaries and local backups

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve the script.

## License

This project is for personal use. Please respect the terms of service of the websites being scraped.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the log file for specific error messages
3. Ensure all prerequisites and setup steps are completed
4. Verify your Gmail API configuration

---

**Happy job hunting! 🌲🌿**