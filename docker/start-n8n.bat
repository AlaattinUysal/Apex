@echo off
echo ===================================
echo       n8n Baslatiliyor...
echo ===================================
docker compose up -d
if %errorlevel% neq 0 (
    echo.
    echo [HATA] Docker calismiyor olabilir. Lutfen once Docker Desktop uygulamasini baslatin!
    pause
    exit /b %errorlevel%
)
echo.
echo n8n basariyla arka planda baslatildi!
echo Tarayicinizdan asagidaki adrese gidebilirsiniz:
echo http://localhost:5678
echo.
pause
