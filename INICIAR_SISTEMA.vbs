' AbregoTech LISCORE - Lanzador Silencioso 100% Sin Ventanas (Zero Black Screens)
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.Run "wscript.exe //B """ & currentDir & "\server\launch-silent.vbs""", 0, False
