@echo off
echo ================================================
echo   ZenTrack - Building Windows Native App
echo ================================================
echo.

echo 📦 Installing Electron dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo 🔨 Building web app...
call npm run build

if %errorlevel% neq 0 (
    echo ❌ Failed to build web app!
    pause
    exit /b 1
)

echo.
echo ⚡ Building Windows executable...
call npm run build:win

if %errorlevel% neq 0 (
    echo ❌ Failed to build Windows executable!
    echo.
    echo 💡 This might be due to missing icons. Check electron/ICONS_README.md
    pause
    exit /b 1
)

echo.
echo ================================================
echo   ✅ Build Complete!
echo ================================================
echo.
echo 🎯 Your Windows app is ready in the 'release' folder:
echo    - ZenTrack Setup.exe (installer)
echo    - ZenTrack-Portable.exe (portable version)
echo.
echo 💡 The portable version can run without installation!
echo.
pause
