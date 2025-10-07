@echo off
echo ========================================
echo Korean Conversation Practice Agent Setup
echo ========================================
echo.

echo Installing dependencies...
npm install

echo.
echo ========================================
echo Environment Setup
echo ========================================
echo.

if not exist .env (
    echo Creating .env file from template...
    copy env-template-korean-agent.txt .env
    echo.
    echo IMPORTANT: Please edit .env file and add your API keys:
    echo 1. OpenAI API key (required)
    echo 2. Google Docs API credentials (optional)
    echo.
    echo Opening .env file for editing...
    notepad .env
) else (
    echo .env file already exists.
)

echo.
echo ========================================
echo Google Docs API Setup (Optional)
echo ========================================
echo.
echo To integrate with your Google Doc vocabulary:
echo 1. Go to Google Cloud Console
echo 2. Create a new project or select existing one
echo 3. Enable Google Docs API
echo 4. Create service account credentials
echo 5. Download JSON credentials file
echo 6. Extract client_email and private_key to .env file
echo 7. Share your Google Doc with the service account email
echo.
echo If you skip this step, the agent will use built-in vocabulary.
echo.

echo ========================================
echo Building and Starting Agent
echo ========================================
echo.

echo Building TypeScript...
npm run build

echo.
echo Starting Korean Conversation Practice Agent...
echo.
echo The agent will be available at: http://localhost:3001
echo.
echo Press Ctrl+C to stop the agent
echo.

npm run korean-agent

pause





