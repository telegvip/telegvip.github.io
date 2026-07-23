@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title TELEGVIP - Limpiar GitHub Pages

echo.
echo ================================================
echo   TELEGVIP - LIMPIANDO ARCHIVOS INNECESARIOS
echo ================================================
echo.

if exist "functions\node_modules" (
  echo Eliminando functions\node_modules...
  rmdir /s /q "functions\node_modules"
)

if exist "node_modules" (
  echo Eliminando node_modules de la raiz...
  rmdir /s /q "node_modules"
)

if exist ".firebase" rmdir /s /q ".firebase"
if exist "functions\.firebase" rmdir /s /q "functions\.firebase"
del /q "firebase-debug.log*" 2>nul
del /q "functions\firebase-debug.log*" 2>nul

echo.
echo ================================================
echo   LIMPIEZA TERMINADA
 echo ================================================
echo.
echo Ahora abre GitHub Desktop.
echo Deja TODOS los cambios marcados, crea el commit y pulsa Push origin.
echo No vuelvas a ejecutar npm install antes del commit.
echo.
pause
