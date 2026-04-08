@echo off
setlocal
set "BASE_DIR=%~dp0"
cd /d "%BASE_DIR%"

:: Set Window Title
title PDDikti Dashboard - Initializing...

:: Clear console
cls

:: 1. CEK APAKAH PORT 5000 BENAR-BENAR DIPAKAI (EXACT MATCH)
:: Gunakan PowerShell untuk pengecekan yang lebih akurat
powershell -Command "if (Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue) { exit 1 } else { exit 0 }" 2>nul
if %errorlevel% == 1 (
    echo.
    powershell -Command "Write-Host '-------------------------------------------------------' -ForegroundColor Red"
    powershell -Command "Write-Host '[!] DASHBOARD SUDAH JALAN (Port 5000 Terpakai)' -ForegroundColor Yellow"
    powershell -Command "Write-Host '[!] Buka browser: http://localhost:5000' -ForegroundColor Cyan"
    powershell -Command "Write-Host '-------------------------------------------------------' -ForegroundColor Red"
    echo.
    pause
    exit /b
)

:: 2. TAMPILAN HEADER
echo.
powershell -Command "Write-Host '=======================================================' -ForegroundColor Cyan"
powershell -Command "Write-Host '           PDDikti Dashboard Control Center            ' -ForegroundColor White -BackgroundColor DarkCyan"
powershell -Command "Write-Host '=======================================================' -ForegroundColor Cyan"
echo.

:: 3. SYNC DEPENDENCIES
powershell -Command "Write-Host '[~] [1/2] Mensinkronkan dependencies...' -ForegroundColor Gray"
pip install -r requirements.txt --quiet --no-warn-script-location

:: 4. START FLASK
powershell -Command "Write-Host '[~] [2/2] Menjalankan Flask Dashboard...' -ForegroundColor Gray"
echo.
powershell -Command "Write-Host '[*] STATUS : ' -NoNewline; Write-Host 'READY' -ForegroundColor Green"
powershell -Command "Write-Host '[*] URL    : http://localhost:5000' -ForegroundColor Cyan"
powershell -Command "Write-Host '[*] TIPS   : Tekan CTRL+C untuk mematikan dashboard.' -ForegroundColor White"
echo.
powershell -Command "Write-Host '-------------------------------------------------------' -ForegroundColor Cyan"
echo.

:: Set Final Title
title PDDikti Dashboard [RUNNING]

:: Jalankan App
python app.py

:: Jika berhenti tiba-tiba
if %errorlevel% neq 0 (
    echo.
    powershell -Command "Write-Host '[!] ERROR: Dashboard berhenti mendadak.' -ForegroundColor Red"
    powershell -Command "Write-Host '[?] Cek apakah Python sudah terinstall atau port 5000 diblokir.' -ForegroundColor White"
    echo.
    pause
)
