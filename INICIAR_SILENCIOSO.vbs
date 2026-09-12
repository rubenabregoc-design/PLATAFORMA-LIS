' AbregoTech LISCORE - Lanzador Silencioso Sin Ventanas CMD (Windows Invisible Mode)
Set WshShell = CreateObject("WScript.Shell")
strPath = WshShell.CurrentDirectory
WshShell.Run "cmd /c ""cd /d """ & strPath & """ && INICIAR_PRODUCCION_COMPLETA.bat""", 0, False
