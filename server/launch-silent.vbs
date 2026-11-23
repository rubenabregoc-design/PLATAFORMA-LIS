' ==============================================================================
' AbregoTech LISCORE — Lanzador Silencioso en Segundo Plano (Zero Black Screens)
' ==============================================================================
' Este script arranca todos los motores del sistema en segundo plano seguro:
' 1. Motor de Base de Datos PostgreSQL 16 (Puerto 5432)
' 2. API REST PostgREST Local (Puerto 8000) con ejecutable local bin\postgrest.exe
' 3. Middleware Bridge ASTM E1381 / HL7 v2.x TCP (Puertos 5101-5109 y WebSocket :8765)
' 4. Enrutador de Portales Dedicados (Puertos 3001, 3002, 3003)
' 5. Servidor Clínico LISCORE (Puerto 3000)
' Todos los procesos corren con WindowStyle = 0 (vbHide / 100% Invisible).
' ==============================================================================

Option Explicit
Dim WshShell, fso, scriptDir, projectDir

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Obtener la ruta raíz del proyecto
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
projectDir = fso.GetParentFolderName(scriptDir)

' Configurar PATH para que postgrest y los servicios siempre encuentren LIBPQ.dll y utilidades de PostgreSQL
Dim envProcess
Set envProcess = WshShell.Environment("PROCESS")
envProcess("PATH") = projectDir & "\bin;C:\Users\Usuario\pgsql\bin;" & envProcess("PATH")

' 1. Iniciar Base de Datos PostgreSQL 16 (Puerto 5432)
Dim pgCtlExe, pgDataDir
pgCtlExe = "C:\Users\Usuario\pgsql\bin\pg_ctl.exe"
pgDataDir = "C:\Users\Usuario\pgsql\data"
If fso.FileExists(pgCtlExe) And fso.FolderExists(pgDataDir) Then
    WshShell.Run """" & pgCtlExe & """ start -D """ & pgDataDir & """ -w", 0, True
End If

' 2. Iniciar API REST PostgREST (Puerto 8000) usando bin local
Dim postgrestExe
postgrestExe = projectDir & "\bin\postgrest.exe"
If Not fso.FileExists(postgrestExe) Then
    postgrestExe = "C:\Users\Usuario\pgsql\bin\postgrest.exe"
End If
If fso.FileExists(postgrestExe) Then
    WshShell.CurrentDirectory = projectDir
    WshShell.Run """" & postgrestExe & """ postgrest.conf", 0, False
End If

WScript.Sleep 1000

' 3. Iniciar Middleware Bridge de Analizadores Clínicos (ASTM / HL7 / TCP / WebSocket :8765)
WshShell.CurrentDirectory = projectDir
WshShell.Run "node server\middleware-bridge.js", 0, False

' 4. Iniciar Enrutador de Portales Dedicados (Puertos 3001, 3002, 3003)
WshShell.CurrentDirectory = projectDir
WshShell.Run "node server\portal-proxy.js", 0, False

' 5. Iniciar Servidor Web LISCORE Principal (Puerto 3000)
WshShell.CurrentDirectory = projectDir
WshShell.Run "cmd /c npm run dev -- --host", 0, False

' Esperar 3 segundos para inicialización y abrir la plataforma médica
WScript.Sleep 3000
WshShell.Run "http://localhost:3000", 1, False
