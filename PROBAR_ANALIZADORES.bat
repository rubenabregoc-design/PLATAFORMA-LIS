@echo off
chcp 65001 > nul
title AbregoTech LIS - Prueba de Transmision Real TCP Analizadores
color 0A
cd /d "%~dp0"

echo ===============================================================================
echo     TRANSMISION REAL DE TRAMAS TCP HACIA ANALIZADORES CLINICOS
echo ===============================================================================
echo.
echo   Enviando tramas reales ASTM y HL7 a los puertos TCP locales...
echo.

node server/test-analyzer-client.js all

echo.
echo ===============================================================================
echo   Prueba completada. Las tramas fueron recibidas e interpretadas por el Middleware.
echo ===============================================================================
echo.
pause
