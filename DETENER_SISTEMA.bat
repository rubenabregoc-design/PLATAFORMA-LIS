@echo off
title AbregoTech LISCORE - Apagado Completo de Servicios
color 0C
cd /d "%~dp0"

echo Deteniendo servicios de fondo...
taskkill /f /im postgrest.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq AbregoTech*" >nul 2>&1

echo ============================================================
echo   [OK] Base de Datos PostgREST detenida
echo   [OK] Middleware ACE detenido
echo   [OK] Enrutador y Servidor Web detenidos
echo   ¡TODOS LOS SERVICIOS LISCORE HAN SIDO DETENIDOS!
echo ============================================================
timeout /t 2 >nul
