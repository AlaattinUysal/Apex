@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

set "URL=http://localhost:5678/webhook/yeni-mesaj"
set "MODE=PROD (/webhook/)"

:MENU
cls
echo ===============================================================
echo             n8n OGRENCI MESAJ GONDERME PANELI
echo ===============================================================
echo Hedef URL : %URL% [%MODE%]
echo ===============================================================
echo.
echo [1] Ahmet  : "IndexError: list index out of range" hatasi
echo [2] Zeynep : len() ve liste son eleman IndexError (Benzer Hata)
echo [3] Mehmet : return vs print arasindaki fark
echo [4] Burak  : Uygunsuz / kaba mesaj (Filtrelenmesi gereken)
echo [5] Elif   : append() vs extend() farki
echo.
echo [6] HEPSINI SIRAYLA GONDER (2 sn aralikla 5 mesaj)
echo [7] Kendin ozel mesaj yazip gonder
echo [8] URL Modunu Degistir (Test / Uretim)
echo [9] SON OZETI TARAYICIDA AC (HTML Panel)
echo [0] Cikis
echo ===============================================================
set "SECIM="
set /p SECIM="Seciminiz (0-9): "

if not defined SECIM exit /b
if "%SECIM%"=="0" exit /b
if "%SECIM%"=="1" goto GONDER_1
if "%SECIM%"=="2" goto GONDER_2
if "%SECIM%"=="3" goto GONDER_3
if "%SECIM%"=="4" goto GONDER_4
if "%SECIM%"=="5" goto GONDER_5
if "%SECIM%"=="6" goto GONDER_HEPSI
if "%SECIM%"=="7" goto GONDER_OZEL
if "%SECIM%"=="8" goto DEGISTIR_MOD
if "%SECIM%"=="9" goto AC_OZET
goto MENU

:AC_OZET
start http://localhost:5678/webhook/ozet
goto MENU

:GONDER_1
call :SEND "Ahmet" "Hocam for dongusuyle listeyi gezerken 'IndexError: list index out of range' hatasi aliyorum, neden olabilir?"
pause
goto MENU

:GONDER_2
call :SEND "Zeynep" "Listede son elemana ulasmaya calisirken IndexError veriyor, len() fonksiyonu kullanirken bir yeri mi kaciriyorum?"
pause
goto MENU

:GONDER_3
call :SEND "Mehmet" "Fonksiyon icinde return kullanmak ile sadece print yazmak arasindaki fark nedir hocam?"
pause
goto MENU

:GONDER_4
call :SEND "Burak" "Bos yapma hoca ders cok sikici boyle ders mi anlatilir kapat git ya"
pause
goto MENU

:GONDER_5
call :SEND "Elif" "Hocam bir listeye baska bir listeyi eklerken append() mi yoksa extend() mi kullanmaliyiz?"
pause
goto MENU

:GONDER_HEPSI
echo.
echo [1/5] Ahmet gonderiliyor...
call :SEND "Ahmet" "Hocam for dongusuyle listeyi gezerken 'IndexError: list index out of range' hatasi aliyorum, neden olabilir?"
timeout /t 2 /nobreak >nul
echo [2/5] Zeynep gonderiliyor...
call :SEND "Zeynep" "Listede son elemana ulasmaya calisirken IndexError veriyor, len() fonksiyonu kullanirken bir yeri mi kaciriyorum?"
timeout /t 2 /nobreak >nul
echo [3/5] Mehmet gonderiliyor...
call :SEND "Mehmet" "Fonksiyon icinde return kullanmak ile sadece print yazmak arasindaki fark nedir hocam?"
timeout /t 2 /nobreak >nul
echo [4/5] Burak gonderiliyor (Uygunsuz)...
call :SEND "Burak" "Bos yapma hoca ders cok sikici boyle ders mi anlatilir kapat git ya"
timeout /t 2 /nobreak >nul
echo [5/5] Elif gonderiliyor...
call :SEND "Elif" "Hocam bir listeye baska bir listeyi eklerken append() mi yoksa extend() mi kullanmaliyiz?"
echo.
echo [+] Tum mesajlar gonderildi!
pause
goto MENU

:GONDER_OZEL
echo.
set /p O_ISIM="Ogrenci Adi: "
set /p O_MESAJ="Mesaj: "
call :SEND "%O_ISIM%" "%O_MESAJ%"
pause
goto MENU

:DEGISTIR_MOD
if "%MODE%"=="PROD (/webhook/)" (
    set "URL=http://localhost:5678/webhook-test/yeni-mesaj"
    set "MODE=TEST (/webhook-test/)"
) else (
    set "URL=http://localhost:5678/webhook/yeni-mesaj"
    set "MODE=PROD (/webhook/)"
)
goto MENU

:SEND
set "K_AD=%~1"
set "K_MSG=%~2"
echo.
echo Gonderiliyor: [%K_AD%] - "%K_MSG%"
set "TMPF=%TEMP%\n8n_%RANDOM%.json"
> "%TMPF%" echo {"kullanici": "%K_AD%", "mesaj": "%K_MSG%"}
curl.exe -s -X POST "%URL%" -H "Content-Type: application/json; charset=utf-8" --data-binary @"%TMPF%"
del "%TMPF%" >nul 2>&1
echo.
exit /b
