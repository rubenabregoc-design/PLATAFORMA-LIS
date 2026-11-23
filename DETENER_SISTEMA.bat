@echo off
title AbregoTech LISCORE - Apagado Completo de Servicios
color 0C
cd /d "%~dp0"

echo ============================================================
echo   AbregoTech LISCORE - Deteniendo Servicios del Sistema...
echo ============================================================
echo.

:: 1. Detener PostgREST y Node
taskkill /f /im postgrest.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq AbregoTech*" >nul 2>&1

:: 2. Detener PostgreSQL local ordenadamente si esta corriendo
if exist "C:\Users\Usuario\pgsql\bin\pg_ctl.exe" (
    "C:\Users\Usuario\pgsql\bin\pg_ctl.exe" stop -D "C:\Users\Usuario\pgsql\data" -m fast >nul 2>&1
)

echo   [OK] Base de Datos PostgreSQL y API PostgREST detenidas
echo   [OK] Middleware Bridge de Analizadores detenido
echo   [OK] Enrutador de Portales y Servidor Web detenidos
echo.
echo ============================================================
echo   ¡TODOS LOS SERVICIOS LISCORE HAN SIDO DETENIDOS CON ÉXITO!
echo ============================================================
timeout /t 3 >nul
