' AbregoTech LISCORE - Lanzador Unificado Silencioso (1-Clic)
Set WshShell = CreateObject("WScript.Shell")
strPath = WshShell.CurrentDirectory
WshShell.Run "cmd /c ""cd /d """ & strPath & """ && INICIAR_SISTEMA.bat""", 0, False
