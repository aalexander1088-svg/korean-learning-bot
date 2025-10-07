# Files Created for Outdoor Job Scraper

This document lists all the files created for the Tampa Bay outdoor job scraper project.

## Core Files

### 🐍 `outdoor_job_scraper.py`
**Main Python script** - The core application that:
- Scrapes Indeed.com for outdoor/nature jobs
- Scrapes local park websites (Hillsborough, Pinellas, Tampa, St Pete, FL State Parks)
- Formats data and sends HTML emails via Gmail API
- Includes comprehensive error handling and logging
- Saves job data to JSON backup files

### 📦 `requirements.txt`
**Python dependencies** - Lists all required packages:
- requests, beautifulsoup4, lxml (web scraping)
- google-auth, google-api-python-client (Gmail API)
- python-dotenv (environment variables)
- Development tools (pytest, black, flake8)

### 📖 `README.md`
**Comprehensive documentation** - Includes:
- Detailed setup instructions
- Gmail API configuration guide
- Usage examples and troubleshooting
- Legal and ethical considerations

## Configuration Files

### 🔧 `env.example`
**Environment variables template** - Shows required configuration:
- EMAIL_ADDRESS (your email for job summaries)
- Optional settings for credentials files and scraping parameters

### 🏃 `run_job_scraper.bat`
**Windows execution script** - Easy-to-use batch file that:
- Checks for Python installation
- Validates EMAIL_ADDRESS environment variable
- Runs the main script with proper error handling

### 🏃 `run_job_scraper.sh`
**Linux/Mac execution script** - Shell script that:
- Checks for Python installation
- Validates EMAIL_ADDRESS environment variable
- Runs the main script with proper error handling

## Setup Scripts

### ⚙️ `setup_windows.bat`
**Windows setup automation** - Automated setup that:
- Verifies Python installation
- Installs required packages via pip
- Provides next steps for Gmail API setup

### ⚙️ `setup.sh`
**Linux/Mac setup automation** - Automated setup that:
- Verifies Python installation
- Installs required packages via pip
- Provides next steps for Gmail API setup

## Files You Need to Provide

### 🔑 `credentials.json`
**Gmail API credentials** - Download from Google Cloud Console:
1. Create/select a Google Cloud project
2. Enable Gmail API
3. Create OAuth 2.0 credentials (Desktop application)
4. Download and rename to `credentials.json`

### 🔐 `token.json`
**Gmail authentication tokens** - Auto-generated on first run:
- Created automatically when you authenticate with Gmail
- Contains refresh tokens for future runs

## Generated Files (Created Automatically)

### 📊 `outdoor_jobs_YYYYMMDD_HHMMSS.json`
**Job data backups** - Timestamped JSON files containing:
- All scraped job listings
- Complete job details (title, company, location, description, URL)
- Source information and posting dates

### 📝 `job_scraper.log`
**Application logs** - Detailed logging including:
- Scraping progress and results
- Error messages and warnings
- Email sending status
- Performance metrics

## Quick Start Checklist

1. ✅ **Install Python 3.7+** (if not already installed)
2. ✅ **Run setup script**: `setup_windows.bat` (Windows) or `./setup.sh` (Linux/Mac)
3. 🔑 **Get Gmail API credentials** from Google Cloud Console
4. 📧 **Set email address**: `set EMAIL_ADDRESS=your.email@gmail.com`
5. 🚀 **Run the scraper**: `run_job_scraper.bat` (Windows) or `./run_job_scraper.sh` (Linux/Mac)

## File Organization

```
outdoor-job-scraper/
├── outdoor_job_scraper.py    # 🐍 Main script
├── requirements.txt          # 📦 Dependencies
├── README.md                # 📖 Documentation
├── env.example              # 🔧 Config template
├── run_job_scraper.bat      # 🏃 Windows runner
├── run_job_scraper.sh       # 🏃 Linux/Mac runner
├── setup_windows.bat        # ⚙️ Windows setup
├── setup.sh                 # ⚙️ Linux/Mac setup
├── FILES_CREATED.md         # 📋 This file
├── credentials.json         # 🔑 You provide this
├── token.json              # 🔐 Auto-generated
├── job_scraper.log         # 📝 Auto-generated
└── outdoor_jobs_*.json     # 📊 Auto-generated
```

## Support

For questions or issues:
1. Check `README.md` for detailed instructions
2. Review `job_scraper.log` for error details
3. Ensure all prerequisites are met
4. Verify Gmail API configuration

---

**Happy job hunting! 🌲🌿**
