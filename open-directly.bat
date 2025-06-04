@echo off
echo ================================================
echo   ZenTrack - Absolutely Zero Dependencies
echo   Works on ANY Windows Computer!
echo ================================================
echo.
echo Opening ZenTrack directly in your browser...
echo This method works even on the most restricted computers!
echo.

REM Try multiple ways to open the HTML file
echo ✅ Launching ZenTrack...

REM Method 1: Direct start command
start "" "dist\index.html" 2>nul

REM Method 2: With file protocol (fallback)
if %errorlevel% neq 0 (
    start "" "file://%CD%\dist\index.html" 2>nul
)

REM Method 3: Using default browser association
if %errorlevel% neq 0 (
    "dist\index.html" 2>nul
)

echo.
echo ================================================
echo   ZenTrack is now running!
echo ================================================
echo.
echo 🎯 Your app should be open in your web browser
echo 💾 All data is saved locally in your browser
echo 📤 Use Export feature to backup your projects
echo 🔒 No internet connection required
echo.
echo 💡 If ZenTrack didn't open automatically:
echo    1. Open any web browser (Chrome, Firefox, Edge, etc.)
echo    2. Press Ctrl+O or go to File → Open File
echo    3. Navigate to: %CD%\dist\index.html
echo    4. Click Open
echo.
echo 📚 Bookmark this for easy access later!
echo.
echo Press any key to close this window...
pause >nul
