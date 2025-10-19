@echo off
echo.
echo ========================================
echo   Starting CivicPulse Application
echo ========================================
echo.

REM Kill existing node processes
echo Cleaning up existing processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Start Backend
echo Starting Backend Server (Port 5000)...
start "CivicPulse Backend" cmd /k "cd /d %~dp0backend && node --no-deprecation server.js"

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Start Frontend
echo Starting Frontend Server (Port 4201)...
start "CivicPulse Frontend" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo ========================================
echo   Both servers are starting!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:4201
echo.
echo Open http://localhost:4201 in your browser
echo.
pause
