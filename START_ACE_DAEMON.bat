@echo off
color 0B
title AbregoTech ACE Daemon - Lanzador
echo ========================================================
echo       Iniciando AbregoTech ACE Daemon...
echo ========================================================
echo.

cd ace-daemon

echo [1/2] Verificando e instalando librerias si es necesario...
call npm install --no-audit --no-fund

echo.
echo [2/2] Levantando Puertos de Hardware y Abriendo GUI...
echo.
echo No cierres esta ventana negra. Minimizala.
echo La interfaz de control se abrira sola en tu navegador.
echo ========================================================
call npm start

pause
