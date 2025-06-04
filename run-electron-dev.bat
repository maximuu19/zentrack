@echo off
echo ================================================
echo   ZenTrack - Development Mode
echo ================================================
echo.

echo 📦 Installing dependencies...
call npm install

echo.
echo 🔨 Building web app...
call npm run build

echo.
echo ⚡ Starting Electron app...
call npm run electron

pause
