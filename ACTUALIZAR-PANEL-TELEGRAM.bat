@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title TELEGVIP - Actualizar panel Telegram

echo.
echo ================================================
echo   TELEGVIP - ACTUALIZAR PANEL Y BOT TELEGRAM
echo ================================================
echo.

if not exist "functions\package.json" (
  echo ERROR: No se encontro functions\package.json.
  echo Copia TODO el contenido del ZIP dentro de la carpeta telegvip.github.io.
  goto :error
)

if not exist "admin\index.html" (
  echo ERROR: No se encontro admin\index.html.
  echo Copia TODO el contenido del ZIP dentro de la carpeta telegvip.github.io.
  goto :error
)

echo 1 de 2 - Verificando dependencias...
pushd "functions"
call npm.cmd install
if errorlevel 1 (
  popd
  goto :error
)
popd

echo.
echo 2 de 2 - Desplegando las funciones del bot...
call firebase.cmd deploy --only functions --project diamantes-pro-players-pro
if errorlevel 1 goto :error

echo.
echo ================================================
echo   FUNCIONES ACTUALIZADAS CORRECTAMENTE
echo ================================================
echo.
echo Ahora abre GitHub Desktop, crea el commit y pulsa Push origin.
pause
exit /b 0

:error
echo.
echo No se pudo completar la actualizacion.
echo Envia por el chat la parte roja o las ultimas lineas del error.
pause
exit /b 1
