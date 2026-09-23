@echo off
title RJ Barber Salon - Booking System
color 0E

echo ===================================================
echo        RJ BARBER SALON - BOOKING SYSTEM
echo ===================================================
echo.

:: Navigate to this directory
cd /d "%~dp0"

:: Check if Node is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Check if node_modules exists, install if missing
if not exist "node_modules\" (
    echo [INFO] Dependencies not found. Installing packages...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        color 0C
        echo [ERROR] npm install failed!
        pause
        exit /b 1
    )
)

echo [INFO] Starting Next.js development server...
echo [INFO] App will be available at: http://localhost:3000
echo.

:: Wait 3 seconds and automatically open browser
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

:: Start Next.js dev server
call npm run dev

pause
