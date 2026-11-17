@echo off
title Asfaque's AI Assistant - Powered by Google Gemini
color 0b

echo ========================================================
echo   Starting Asfaque's AI Assistant
echo ========================================================
echo.

cd /d "%~dp0"

if not exist "node_modules\" (
    echo [1/3] First time setup: Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies. Please ensure Node.js is installed.
        pause
        exit /b 1
    )
) else (
    echo [1/3] Dependencies verified!
)

echo.
echo [2/3] Opening Asfaque's AI Assistant...
start "" http://localhost:3000/asfaque-ai-assistant

echo.
echo [3/3] Server is running! Press Ctrl+C to stop.
echo ========================================================
node server.js

pause
