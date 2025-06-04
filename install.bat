@echo off
echo ================================================
echo   ZenTrack - Minimalist Project Tracker
echo   Easy Installation Script for Windows
echo ================================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js first:
    echo 1. Go to https://nodejs.org/
    echo 2. Download and install the LTS version
    echo 3. Restart this script
    echo.
    pause
    exit /b 1
)

echo Node.js is installed: 
node --version

echo.
echo Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install dependencies!
    echo Try running: npm cache clean --force
    pause
    exit /b 1
)

echo.
echo ================================================
echo   Installation Complete!
echo ================================================
echo.
echo To start the app, run: npm start
echo Or double-click the "start.bat" file
echo.
echo The app will open in your browser at:
echo http://localhost:5173
echo.
pause
