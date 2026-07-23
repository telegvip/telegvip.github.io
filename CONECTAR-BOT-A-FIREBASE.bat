@echo off
setlocal
cd /d "%~dp0"
title TELEGVIP - Conectar bot a Firebase

echo.
echo =====================================================
echo   TELEGVIP - CONECTAR BOT A FIREBASE
echo =====================================================
echo.
echo 1 de 3 - Instalando dependencias...
call npm --prefix functions install
if errorlevel 1 goto :error

echo.
echo 2 de 3 - Desplegando Functions...
call firebase.cmd deploy --only functions --project diamantes-pro-players-pro
if errorlevel 1 goto :error

echo.
echo 3 de 3 - Activando webhook de Telegram...
echo Escribe la MISMA clave que guardaste como TELEGRAM_WEBHOOK_SECRET.
set /p WEBHOOK_SECRET=Clave privada: 
if "%WEBHOOK_SECRET%"=="" goto :error

echo.
curl.exe -sS -X POST "https://us-central1-diamantes-pro-players-pro.cloudfunctions.net/setupTelegramWebhook" -H "Content-Type: application/json" -H "x-telegvip-setup-secret: %WEBHOOK_SECRET%" -d "{}"
echo.
echo.
echo Si arriba aparece "ok":true, el bot ya esta conectado.
echo No compartas la clave escrita.
pause
exit /b 0

:error
echo.
echo No se pudo completar el proceso. Copia el error y envialo por el chat.
pause
exit /b 1
