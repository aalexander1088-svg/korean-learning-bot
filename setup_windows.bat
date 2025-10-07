@echo off
echo ========================================
echo Outdoor Job Scraper Setup for Windows
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo.
    echo Please install Python 3.7+ from https://python.org
    echo Make sure to check "Add Python to PATH" during installation
    echo.
    pause
    exit /b 1
)

echo Python is installed: 
python --version
echo.

REM Install required packages
echo Installing required Python packages...
pip install -r requirements.txt

if errorlevel 1 (
    echo.
    echo ERROR: Failed to install required packages
    echo Please check your internet connection and try again
    pause
    exit /b 1
)

echo.
echo ✅ Setup completed successfully!
echo.
echo Next steps:
echo 1. Get Gmail API credentials from Google Cloud Console
echo 2. Save credentials.json in this directory
echo 3. Set your email address: set EMAIL_ADDRESS=your.email@gmail.com
echo 4. Run: run_job_scraper.bat
echo.
echo For detailed instructions, see README.md
echo.
pause
