@echo off
echo Starting ZenTrack...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Dependencies not found. Installing...
    call npm install
    echo.
)

echo Opening ZenTrack in your browser...
echo Press Ctrl+C to stop the server
echo.

call npm start
