@echo off
echo ========================================
echo Outdoor Job Scraper for Tampa Bay Area
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.7+ from https://python.org
    pause
    exit /b 1
)

REM Check if EMAIL_ADDRESS is set
if "%EMAIL_ADDRESS%"=="" (
    echo ERROR: EMAIL_ADDRESS environment variable is not set
    echo.
    echo Please set your email address first:
    echo   set EMAIL_ADDRESS=your.email@gmail.com
    echo.
    echo Then run this script again.
    pause
    exit /b 1
)

echo Starting job scraper...
echo Email address: %EMAIL_ADDRESS%
echo.

REM Run the Python script
python outdoor_job_scraper.py

echo.
echo Script completed. Check the log file for details.
pause
