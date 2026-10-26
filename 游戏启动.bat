@echo off
setlocal
cd /d "%~dp0"

powershell -NoProfile -NoLogo -ExecutionPolicy Bypass -File "%~dp0server.ps1"

if errorlevel 1 (
  echo.
  echo [!] The server exited with an error. Please read the message above.
  echo.
  pause
)
