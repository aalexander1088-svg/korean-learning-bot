@echo off
REM News Bot Email Runner
REM This script runs the news bot email system

echo Starting News Bot Email System...
echo ==================================

REM Change to the script directory
cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules" (
    echo ❌ node_modules not found. Please run 'npm install' first.
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist ".env" (
    echo ❌ .env file not found. Please create it with your API keys.
    pause
    exit /b 1
)

REM Run the news bot
echo 🚀 Running news bot...
npm run news-bot

if %errorlevel% equ 0 (
    echo ✅ News bot email sent successfully!
) else (
    echo ❌ Failed to send news bot email.
    echo Check the error messages above.
)

echo.
echo Press any key to continue...
pause > nul





