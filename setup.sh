#!/bin/bash

echo "========================================"
echo "Outdoor Job Scraper Setup"
echo "========================================"
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "ERROR: Python is not installed or not in PATH"
    echo
    echo "Please install Python 3.7+ from https://python.org"
    echo "Or use your package manager:"
    echo "  Ubuntu/Debian: sudo apt install python3 python3-pip"
    echo "  macOS: brew install python3"
    echo
    exit 1
fi

# Use python3 if available, otherwise python
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
    PIP_CMD="pip3"
else
    PYTHON_CMD="python"
    PIP_CMD="pip"
fi

echo "Python is installed:"
$PYTHON_CMD --version
echo

# Install required packages
echo "Installing required Python packages..."
$PIP_CMD install -r requirements.txt

if [ $? -ne 0 ]; then
    echo
    echo "ERROR: Failed to install required packages"
    echo "Please check your internet connection and try again"
    exit 1
fi

echo
echo "✅ Setup completed successfully!"
echo
echo "Next steps:"
echo "1. Get Gmail API credentials from Google Cloud Console"
echo "2. Save credentials.json in this directory"
echo "3. Set your email address: export EMAIL_ADDRESS=your.email@gmail.com"
echo "4. Run: ./run_job_scraper.sh"
echo
echo "For detailed instructions, see README.md"
echo
