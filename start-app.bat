@echo off
title SFDC Mentor Career OS - Local Startup
echo =====================================================
echo Starting SFDC Mentor Career OS local servers...
echo =====================================================
echo.

REM Start Ollama local AI server. If Ollama is already running, this window may show an address-in-use message. That is okay.
start "Ollama Local AI" powershell -NoExit -ExecutionPolicy Bypass -Command "ollama serve"

REM Start FastAPI backend server.
start "Career OS Backend" powershell -NoExit -ExecutionPolicy Bypass -Command "cd /d %~dp0backend; if exist .venv\Scripts\activate.ps1 ( .\.venv\Scripts\activate.ps1 ) else ( python -m venv .venv; .\.venv\Scripts\activate.ps1; pip install -r requirements.txt ); uvicorn app.main:app --reload"

REM Start React/Vite frontend server.
start "Career OS Frontend" powershell -NoExit -ExecutionPolicy Bypass -Command "cd /d %~dp0frontend; npm run dev"

REM Open local app after short delay.
timeout /t 5 /nobreak > nul
start http://localhost:5173

echo.
echo Servers are starting in separate windows.
echo Frontend: http://localhost:5173
echo Backend:  http://127.0.0.1:8000/api/health
echo Ollama:   http://127.0.0.1:11434
echo.
echo Keep the opened terminal windows running while using the app.
pause
