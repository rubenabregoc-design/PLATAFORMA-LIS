@echo off
title AbregoTech LISCORE - Limpiador Expres de Disco C:
color 0A
cd /d "%~dp0"

echo ============================================================
echo   AbregoTech LISCORE - Limpiador Expres de Disco C:
echo ============================================================
echo.
echo   [1/5] Vaciando Papelera de Reciclaje...
powershell -Command "Clear-RecycleBin -DriveLetter C -Force -ErrorAction SilentlyContinue" >nul 2>&1

echo   [2/5] Limpiando Archivos Temporales de Usuario (%%TEMP%%)...
powershell -Command "Remove-Item -Path '$env:TEMP\*' -Recurse -Force -ErrorAction SilentlyContinue" >nul 2>&1

echo   [3/5] Limpiando Cache de Gradle (Android Build Cache)...
powershell -Command "Remove-Item -Path 'C:\Users\Usuario\.gradle\caches\*' -Recurse -Force -ErrorAction SilentlyContinue" >nul 2>&1

echo   [4/5] Limpiando Cache de NPM y Navegadores...
powershell -Command "Remove-Item -Path 'C:\Users\Usuario\AppData\Local\npm-cache\*' -Recurse -Force -ErrorAction SilentlyContinue" >nul 2>&1

echo   [5/5] Limpiando Cache de Google Chrome...
powershell -Command "Remove-Item -Path 'C:\Users\Usuario\AppData\Local\Google\Chrome\User Data\Default\Cache\*' -Recurse -Force -ErrorAction SilentlyContinue" >nul 2>&1

echo.
echo ============================================================
echo   ¡LIMPIEZA COMPLETADA CON EXITO!
echo   Espacio libre actual en Disco C:
powershell -Command "Get-PSDrive C"
echo ============================================================
echo.
pause
