@echo off
:: Yonetici haklari kontrolu ve otomatik yetkilendirme
NET SESSION >nul 2>&1
if %errorlevel% neq 0 (
    echo Yonetici izinleri isteniyor...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"%~f0\"' -Verb RunAs"
    exit /b
)

title WSL ve Sanallastirma Kurulumu
cls
echo ========================================================
echo       WSL 2 ve Sanallastirma Bilesenleri Yukleniyor
echo ========================================================
echo.

echo [1/3] Sanal Makine Platformu ve WSL ozellikleri aciliyor...
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

echo.
echo [2/3] Indirilen WSL paketi yukleniyor...
powershell -Command "$msix = Get-ChildItem -Path \"$env:USERPROFILE\Downloads\" -Filter '*.msix' -ErrorAction SilentlyContinue; if ($msix) { Add-AppxPackage -Path $msix[0].FullName }"

echo.
echo [3/3] WSL guncelleniyor...
wsl --update

echo.
echo ========================================================
echo   ISLEM TAMAMLANDI!
echo ========================================================
echo.
echo NOT: Bilesenlerin aktif olmasi icin bilgisayarinizi
echo yeniden baslatmaniz (Restart) gerekebilir.
echo.
echo Yeniden baslattiktan sonra:
echo 1. Docker Desktop'i acin.
echo 2. 'start-n8n.bat' dosyasini calistirin.
echo.
pause
