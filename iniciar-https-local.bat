@echo off
title AbregoTech LIS - HTTPS SSL Local Proxy (Caddy)
color 0B
echo ============================================================
echo   AbregoTech LIS - Servidor HTTPS SSL Local Cifrado
echo ============================================================
echo   - URL HTTPS Cifrada:   https://192.168.0.8
echo   - Candado SSL Activo:  HTTPS Cifrado de Extremo a Extremo
echo ============================================================
echo.
caddy run --config Caddyfile
pause
