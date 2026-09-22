@echo off
setlocal EnableExtensions DisableDelayedExpansion
title MICODENT - Comprobacion sin iniciar
where node.exe >nul 2>&1
if errorlevel 1 (
  echo No se encontro Node.js. Contacte al administrador.
  pause
  exit /b 1
)
node.exe "%~dp0micodent-arranque.cjs" --comprobar
set "RESULTADO=%ERRORLEVEL%"
pause
exit /b %RESULTADO%
