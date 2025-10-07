@echo off
echo 🚀 Setting up Git repository for GitHub Actions...
echo.

echo Step 1: Initializing Git repository...
git init
if %errorlevel% neq 0 (
    echo ❌ Git is not installed. Please install Git first:
    echo    Download from: https://git-scm.com/download/win
    echo    Or run: winget install Git.Git
    pause
    exit /b 1
)

echo Step 2: Adding files to Git...
git add .

echo Step 3: Creating initial commit...
git commit -m "Initial commit: Korean learning and news bot with GitHub Actions"

echo.
echo ✅ Git repository initialized!
echo.
echo Next steps:
echo 1. Create a new repository on GitHub.com
echo 2. Copy the repository URL
echo 3. Run these commands (replace YOUR_USERNAME and REPO_NAME):
echo.
echo    git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 4. Set up GitHub secrets (see GITHUB-SETUP-GUIDE.md)
echo.
pause




