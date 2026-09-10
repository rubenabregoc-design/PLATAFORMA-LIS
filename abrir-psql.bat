@echo off
title PostgreSQL Local - lis_local
color 0B
echo ============================================================
echo   Consola PostgreSQL Local (lis_local)
echo ============================================================
echo   Comandos utiles:
echo     \dt                  - Listar todas las tablas
echo     \d nombre_tabla      - Ver columnas de una tabla
echo     SELECT * FROM patients LIMIT 10;
echo     SELECT * FROM results LIMIT 10;
echo     \q                   - Salir
echo ============================================================
echo.
C:\Users\Usuario\pgsql\bin\psql.exe -U postgres -d lis_local
pause
