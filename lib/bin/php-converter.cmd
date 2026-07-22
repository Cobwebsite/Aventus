@echo off
setlocal

php "%~dp0PhptoTypescript\PhptoTypescript.phar" %*
set "EXIT_CODE=%ERRORLEVEL%"

endlocal & exit /b %EXIT_CODE%