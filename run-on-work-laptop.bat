@echo off
echo ================================================
echo   ZenTrack - Work Laptop Edition
echo   No Installation Required!
echo ================================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Trying python3...
    python3 --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Python not found. Trying direct file method...
        echo.
        echo Opening ZenTrack directly in your browser...
        start dist\index.html
        echo.
        echo ✅ ZenTrack should now be open in your browser!
        echo 💡 Bookmark it for easy access later.
        pause
        exit /b 0
    ) else (
        echo ✅ Python3 found! Starting server...
        python3 serve.py
        exit /b 0
    )
) else (
    echo ✅ Python found! Starting server...
    python serve.py
)

pause
