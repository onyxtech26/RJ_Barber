@echo off
title RJ Barber POS
color 0E
cd /d "%~dp0"

echo ===================================================
echo              RJ BARBER SALON - POS
echo ===================================================
echo.

:: The POS is only reachable from this PC (127.0.0.1). To use it from a tablet on the shop
:: Wi-Fi, see "Using a tablet" in README.md.
set POS_URL=http://127.0.0.1:3000/

where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [ERROR] Node.js is not installed. Install the LTS version from https://nodejs.org/
    pause
    exit /b 1
)

:: Already running? Just open the window.
curl -s -o nul %POS_URL%login >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [INFO] The POS is already running.
    goto open
)

if not exist "node_modules\" (
    echo [INFO] First run: installing packages...
    call npm install
    if %ERRORLEVEL% NEQ 0 goto failed
)

echo [INFO] Preparing database...
call npm run db:setup
if %ERRORLEVEL% NEQ 0 goto failed
call npm run db:backup

node scripts\needs-build.mjs
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Building the app ^(only needed after an update^)...
    call npm run build
    if %ERRORLEVEL% NEQ 0 goto failed
)

:: Open the window once the server answers (in the background, so this window keeps the server).
start "" /min powershell -NoProfile -WindowStyle Hidden -Command ^
  "for ($i = 0; $i -lt 60; $i++) { try { Invoke-WebRequest -UseBasicParsing '%POS_URL%login' -TimeoutSec 2 | Out-Null; break } catch { Start-Sleep -Seconds 1 } };" ^
  "try { Start-Process msedge -ArgumentList '--app=%POS_URL%' -ErrorAction Stop } catch { Start-Process '%POS_URL%' }"

echo.
echo [INFO] POS running at %POS_URL%  -  keep this window open. Close it to stop the POS.
echo.
call npm run start
goto end

:open
powershell -NoProfile -Command "try { Start-Process msedge -ArgumentList '--app=%POS_URL%' -ErrorAction Stop } catch { Start-Process '%POS_URL%' }"
goto end

:failed
color 0C
echo.
echo [ERROR] Something went wrong above. Take a photo of this window and send it to support.
pause
exit /b 1

:end
