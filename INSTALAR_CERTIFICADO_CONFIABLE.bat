@echo off
title AbregoTech LIS - Instalador de Certificado SSL Confiable
color 0A
cd /d "%~dp0"
echo ============================================================
echo   AbregoTech LISCORE - Instalando Certificado SSL Confiable
echo ============================================================
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0server\install-trusted-ssl.ps1"
echo.
echo Presione cualquier tecla para finalizar...
pause
