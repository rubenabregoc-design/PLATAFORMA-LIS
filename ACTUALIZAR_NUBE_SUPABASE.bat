@echo off
title AbregoTech LISCORE - Copiar SQL a Portapapeles
cd /d "%~dp0"

echo ==============================================================================
echo   AbregoTech LISCORE — Sincronizador de Esquema para Supabase Cloud
echo ==============================================================================
echo.
echo [1/2] Copiando las 82 tablas e indices compuestos al portapapeles...
powershell -Command "[System.IO.File]::ReadAllText('supabase\FULL_CLOUD_SCHEMA_CONSOLIDATED.sql') | Set-Clipboard"

echo [2/2] Abriendo el Editor SQL de Supabase en tu navegador...
start "" "https://supabase.com/dashboard/project/vsrhpjhmdkykgqyntstr/sql/new"

echo.
echo ==============================================================================
echo   LISTO:
echo   1. En la pagina que se acaba de abrir en tu navegador, presiona: Ctrl + V
echo   2. Haz clic en el boton verde "RUN" (o presiona Ctrl + Enter)
echo   3. Tus 82 tablas clinicas quedaran creadas en la nube en 3 segundos.
echo ==============================================================================
echo.
pause
