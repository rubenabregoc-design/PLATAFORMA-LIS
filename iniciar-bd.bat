@echo off
title AbregoTech LIS - API Base de Datos PostgREST
color 0B
echo ============================================================
echo   AbregoTech LIS - API Local PostgREST (PostgreSQL 16)
echo ============================================================
echo   - PostgreSQL Local:    localhost:5432 (lis_local)
echo   - API REST:            http://localhost:8000
echo ============================================================
echo.
cd /d "%~dp0"
C:\Users\Usuario\pgsql\bin\postgrest.exe postgrest.conf
pause
