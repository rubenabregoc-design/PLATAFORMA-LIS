# AbregoTech LISCORE - Registrar Arranque Automático al Encender Windows
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  AbregoTech LISCORE - Registrando Arranque Automático" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

try {
    $startupFolder = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
    $shortcutPath = Join-Path $startupFolder "AbregoTech_LISCORE.vbs"
    $projectDir = ($PSScriptRoot | Split-Path -Parent) -replace '\\$', ''

    $vbsContent = "' AbregoTech LISCORE AutoStart`r`nSet WshShell = CreateObject(""WScript.Shell"")`r`nWshShell.Run ""cmd /c """"cd /d $projectDir && INICIAR_SISTEMA.bat"""""", 0, False`r`n"

    Set-Content -Path $shortcutPath -Value $vbsContent

    Write-Host "OK: Registrado exitosamente en la carpeta de Inicio de Windows:" -ForegroundColor Green
    Write-Host "    $shortcutPath" -ForegroundColor Yellow
} catch {
    Write-Host "Error registrando arranque automatico: $_" -ForegroundColor Red
}
