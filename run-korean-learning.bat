@echo off
REM Korean Learning Email Runner
REM This script runs the Korean learning email system

echo Starting Korean Learning Email System...
echo ========================================

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

REM Run the reliable Korean learning email script
echo 🚀 Running reliable Korean learning email script...
npm run reliable-schedule

if %errorlevel% equ 0 (
    echo ✅ Korean learning email sent successfully!
) else (
    echo ❌ Failed to send Korean learning email.
    echo Check the error messages above.
)

echo.
echo Press any key to continue...
pause > nul