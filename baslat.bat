@echo off
chcp 65001 >nul
echo Apex sistemi baslatiliyor...

start "Apex - AI Service (Port 8000)" cmd /k "cd ai-service && python -m uvicorn app.main:app --reload --port 8000"
start "Apex - Web App (Port 3000)" cmd /k "cd web && npm run dev"

echo.
echo ===================================================
echo [1] AI Servisi: http://localhost:8000
echo [2] Web Arayüzü: http://localhost:3000
echo ===================================================
echo Servisler ayri pencerelerde calisiyor.
echo.
pause
