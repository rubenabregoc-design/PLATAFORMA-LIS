' ==============================================================================
' AbregoTech LISCORE — Lanzador Silencioso en Segundo Plano (Zero Black Screens)
' ==============================================================================
' Este script arranca todos los motores del sistema en segundo plano seguro:
' 1. Motor de Base de Datos PostgREST (Puerto 8000)
' 2. Middleware de Analizadores ACE Daemon (Puerto 5100)
' 3. Enrutador de Portales Dedicados (Puertos 3001, 3002, 3003)
' 4. Servidor Clínico LISCORE (Puerto 3000)
' Todos los procesos corren con WindowStyle = 0 (vbHide / 100% Invisible).
' ==============================================================================

Option Explicit
Dim WshShell, fso, scriptDir, projectDir

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Obtener la ruta raíz del proyecto
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
projectDir = fso.GetParentFolderName(scriptDir)

' 1. Iniciar Base de Datos PostgreSQL / PostgREST (Modo 0 = Invisible)
Dim postgrestExe
postgrestExe = "C:\Users\Usuario\pgsql\bin\postgrest.exe"
If fso.FileExists(postgrestExe) Then
    WshShell.CurrentDirectory = projectDir
    WshShell.Run """" & postgrestExe & """ postgrest.conf", 0, False
End If

WScript.Sleep 1000

' 2. Iniciar Middleware ACE Daemon para Analizadores Clínicos (Puerto 5100)
Dim aceDir
aceDir = projectDir & "\ace-daemon"
If fso.FolderExists(aceDir) Then
    WshShell.CurrentDirectory = aceDir
    WshShell.Run "cmd /c npm start", 0, False
End If

' 3. Iniciar Enrutador de Portales Dedicados (Puertos 3001, 3002, 3003)
WshShell.CurrentDirectory = projectDir
WshShell.Run "node server\portal-proxy.js", 0, False

' 4. Iniciar Servidor Web LISCORE Principal (Puerto 3000)
WshShell.CurrentDirectory = projectDir
WshShell.Run "cmd /c npm run dev -- --host", 0, False

' Esperar 3 segundos para inicialización y abrir la plataforma médica
WScript.Sleep 3000
WshShell.Run "http://localhost:3000", 1, False
