@echo off
echo Creating Windows Task Scheduler for Korean Learning Emails
echo ========================================================

REM Get the current directory
set "SCRIPT_DIR=%~dp0"
set "NODE_PATH=%SCRIPT_DIR%node_modules\.bin"

echo Script Directory: %SCRIPT_DIR%
echo Node Path: %NODE_PATH%

REM Create the task
schtasks /create /tn "KoreanLearningEmail" /tr "\"%SCRIPT_DIR%run-korean-learning.bat\"" /sc daily /st 05:00 /ru "%USERNAME%" /f

if %errorlevel% equ 0 (
    echo ✅ Task created successfully!
    echo 📧 Korean learning emails will be sent daily at 5:00 AM
    echo 💻 Task will run even when computer is in sleep mode
    echo.
    echo To view/edit the task:
    echo   - Open Task Scheduler
    echo   - Look for "KoreanLearningEmail" task
    echo.
    echo To delete the task:
    echo   schtasks /delete /tn "KoreanLearningEmail" /f
) else (
    echo ❌ Failed to create task. Please run as Administrator.
)

echo.
echo Press any key to continue...
pause > nul





