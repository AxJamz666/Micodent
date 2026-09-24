@echo off
setlocal EnableExtensions DisableDelayedExpansion
title MICODENT - Inicio verificado V4.0.3
if not exist "%~dp0micodent-arranque.cjs" (
  echo Falta micodent-arranque.cjs. Mantenga juntos los tres archivos del lanzador.
  pause
  exit /b 1
)
where node.exe >nul 2>&1
if errorlevel 1 (
  echo No se encontro Node.js. Contacte al administrador.
  pause
  exit /b 1
)
node.exe "%~dp0micodent-arranque.cjs"
set "RESULTADO=%ERRORLEVEL%"
if not "%RESULTADO%"=="0" pause
exit /b %RESULTADO%
