@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title TELEGVIP - Conectar bot a Firebase

echo.
echo =====================================================
echo   TELEGVIP - CONECTAR BOT A FIREBASE (CORREGIDO)
echo =====================================================
echo.

if not exist "functions\package.json" (
  echo ERROR: No se encontro functions\package.json.
  echo Copia TODO el contenido de este parche dentro de la carpeta telegvip.github.io.
  goto :error
)

echo 1 de 3 - Instalando dependencias dentro de la carpeta functions...
pushd "functions"
call npm.cmd install
if errorlevel 1 (
  popd
  goto :error
)
popd

echo.
echo 2 de 3 - Desplegando Cloud Functions...
call firebase.cmd deploy --only functions --project diamantes-pro-players-pro
if errorlevel 1 goto :error

echo.
echo 3 de 3 - Activando el webhook de Telegram...
echo Escribe la MISMA clave que guardaste como TELEGRAM_WEBHOOK_SECRET.
set "WEBHOOK_SECRET="
set /p "WEBHOOK_SECRET=Clave privada: "
if not defined WEBHOOK_SECRET goto :error

echo.
curl.exe -sS -X POST "https://us-central1-diamantes-pro-players-pro.cloudfunctions.net/setupTelegramWebhook" -H "Content-Type: application/json" -H "x-telegvip-setup-secret: %WEBHOOK_SECRET%" --data "{}"
echo.
echo.
echo Si arriba aparece "ok":true, el bot ya quedo conectado con Firebase.
echo Desde ese momento getUpdates dejara de funcionar porque Telegram usara el webhook.
pause
exit /b 0

:error
echo.
echo No se pudo completar el proceso.
echo Copia la parte roja o el ultimo error y envialo por el chat.
pause
exit /b 1
