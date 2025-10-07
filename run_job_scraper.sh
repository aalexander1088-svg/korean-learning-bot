#!/bin/bash

echo "========================================"
echo "Outdoor Job Scraper for Tampa Bay Area"
echo "========================================"
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "ERROR: Python is not installed or not in PATH"
    echo "Please install Python 3.7+ from https://python.org"
    exit 1
fi

# Use python3 if available, otherwise python
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
else
    PYTHON_CMD="python"
fi

# Check if EMAIL_ADDRESS is set
if [ -z "$EMAIL_ADDRESS" ]; then
    echo "ERROR: EMAIL_ADDRESS environment variable is not set"
    echo
    echo "Please set your email address first:"
    echo "  export EMAIL_ADDRESS=your.email@gmail.com"
    echo
    echo "Then run this script again."
    exit 1
fi

echo "Starting job scraper..."
echo "Email address: $EMAIL_ADDRESS"
echo "Python command: $PYTHON_CMD"
echo

# Run the Python script
$PYTHON_CMD outdoor_job_scraper.py

echo
echo "Script completed. Check the log file for details."
