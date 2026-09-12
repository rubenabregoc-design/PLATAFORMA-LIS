@echo off
title AbregoTech LISCORE - Configurar Arranque Automatico con Windows
color 0A
cd /d "%~dp0"

echo ============================================================
echo   AbregoTech LISCORE - Configurando Arranque Automático
echo ============================================================
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0server\register-autostart.ps1"
echo.
pause
