' AbregoTech LISCORE - Detener Todos los Servicios Silencioso (1-Clic)
Set WshShell = CreateObject("WScript.Shell")
strPath = WshShell.CurrentDirectory
WshShell.Run "cmd /c ""cd /d """ & strPath & """ && DETENER_SISTEMA_1_CLIC.bat""", 0, False
