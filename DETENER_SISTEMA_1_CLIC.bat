@echo off
title AbregoTech LIS/HIS - Detener Todos los Servicios (1-Clic)
color 0C
cd /d "%~dp0"

echo ============================================================
echo   AbregoTech LISCORE - Deteniendo Todos los Servicios
echo ============================================================
echo.
echo   [1/3] Finalizando Servidores Node.js y Middleware ACE Daemon...
taskkill /f /im node.exe >nul 2>&1

echo   [2/3] Deteniendo Motor de Base de Datos PostgREST...
taskkill /f /im postgrest.exe >nul 2>&1

echo   [3/3] Cerrando Consolas de Ejecucion...
taskkill /f /fi "WINDOWTITLE eq AbregoTech*" >nul 2>&1

echo.
echo ============================================================
echo   ¡TODOS LOS SERVICIOS HA SIDO DETENIDOS EXITOSAMENTE!
echo ============================================================
echo.
timeout /t 2 >nul
