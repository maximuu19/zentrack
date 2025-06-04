@echo off
echo ================================================
echo   ZenTrack - Zero Dependencies Edition
echo   Works on ANY Windows Computer!
echo ================================================
echo.

echo Checking what's available on this computer...
echo.

REM Try Method 1: Python Server (Best experience)
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Python found! Using server mode for best experience...
    python serve.py
    exit /b 0
)

python3 --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Python3 found! Using server mode for best experience...
    python3 serve.py
    exit /b 0
)

echo ⚠️  Python not found. No problem!
echo.

REM Try Method 2: PowerShell Server (Windows built-in)
echo Trying PowerShell web server (built into Windows)...
powershell -Command "& {if (Get-Command Start-Process -ErrorAction SilentlyContinue) {Write-Host '✅ PowerShell available! Starting mini web server...'; exit 0} else {exit 1}}" >nul 2>&1
if %errorlevel% equ 0 (
    echo Starting PowerShell mini server...
    powershell -ExecutionPolicy Bypass -File "serve.ps1"
    exit /b 0
)

REM Method 3: Direct Browser Access (Always works)
echo Using direct browser method...
echo.
echo ================================================
echo   Opening ZenTrack directly in your browser
echo ================================================
echo.
echo ✅ This method works on ANY computer!
echo 💡 Your app will open in a new browser window/tab
echo 📁 All your data stays on this computer
echo.

REM Try to open in different browsers
start "" "dist\index.html" >nul 2>&1
if %errorlevel% neq 0 (
    REM Fallback: try with file:// protocol
    start "" "file://%CD%\dist\index.html" >nul 2>&1
)

echo.
echo ================================================
echo   ZenTrack is now running!
echo ================================================
echo.
echo 🎯 Your project tracker should be open in your browser
echo 📚 If it didn't open automatically:
echo    1. Open any web browser
echo    2. Press Ctrl+O (or File → Open)
echo    3. Navigate to this folder → dist → index.html
echo    4. Double-click index.html
echo.
echo 💾 Your data is saved automatically in your browser
echo 📤 Use the Export feature to backup your projects
echo.
echo Press any key to close this window...
pause >nul
