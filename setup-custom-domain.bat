@echo off
:: Batch file to map 'asfaque-ai-assistant' to 127.0.0.1 in Windows hosts file
title Setup Custom Domain - Asfaque AI Assistant
color 0a

echo ========================================================
echo  Mapping custom URL: http://asfaque-ai-assistant:3000
echo ========================================================
echo.

:: Check for Administrator permissions
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Yeh script chalane ke liye Administrator permission chahiye.
    echo Kripya is file par Right Click karein aur "Run as administrator" select karein!
    echo.
    pause
    exit /b 1
)

set HOSTS_PATH=%WINDIR%\System32\drivers\etc\hosts

findstr /C:"asfaque-ai-assistant" "%HOSTS_PATH%" >nul
if %errorlevel% equ 0 (
    echo [OK] 'asfaque-ai-assistant' pehle se hi hosts file me mapped hai!
) else (
    echo 127.0.0.1    asfaque-ai-assistant >> "%HOSTS_PATH%"
    echo [SUCCESS] 'asfaque-ai-assistant' successfully added to hosts file!
)

echo.
echo ========================================================
echo Ab aap browser me seedhe yeh link khol sakte hain:
echo http://asfaque-ai-assistant:3000/asfaque-ai-assistant
echo ========================================================
echo.
pause
