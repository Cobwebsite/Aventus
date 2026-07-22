@echo off
setlocal

dotnet "%~dp0CSharpToTypescript\CSharpToTypescript.dll" %*
set "EXIT_CODE=%ERRORLEVEL%"

endlocal & exit /b %EXIT_CODE%