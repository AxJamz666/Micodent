@echo off
setlocal EnableExtensions DisableDelayedExpansion
title MICODENT - Inicio verificado
where node.exe >nul 2>&1
if errorlevel 1 (
  echo No se encontro Node.js. Contacte al administrador; no reinstale MICODENT.
  pause
  exit /b 1
)
node.exe "%~dp0micodent-arranque.cjs"
set "RESULTADO=%ERRORLEVEL%"
if not "%RESULTADO%"=="0" pause
exit /b %RESULTADO%
