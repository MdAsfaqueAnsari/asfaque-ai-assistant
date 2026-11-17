@echo off
title Push to GitHub - MdAsfaqueAnsari
color 0a

echo ========================================================
echo   Pushing project to MdAsfaqueAnsari/asfaque-ai-assistant
echo ========================================================
echo.

cd /d "%~dp0"
git remote set-url origin https://github.com/MdAsfaqueAnsari/asfaque-ai-assistant.git
git branch -M main
git push -u origin main

if errorlevel 1 (
    echo.
    echo [NOTE] Agar GitHub login prompt aaye toh apne browser me MdAsfaqueAnsari se authorize karein.
) else (
    echo.
    echo [SUCCESS] Successfully pushed to https://github.com/MdAsfaqueAnsari/asfaque-ai-assistant
)

echo.
pause
