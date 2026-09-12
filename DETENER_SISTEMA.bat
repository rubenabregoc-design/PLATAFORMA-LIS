@echo off
title AbregoTech LISCORE - Apagado Completo
color 0C
cd /d "%~dp0"

taskkill /f /im node.exe >nul 2>&1
taskkill /f /im postgrest.exe >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq AbregoTech*" >nul 2>&1

echo ============================================================
echo   ¡SISTEMA LISCORE DETENIDO EXITOSAMENTE!
echo ============================================================
timeout /t 2 >nul
