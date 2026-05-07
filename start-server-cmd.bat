@echo off
REM Simple batch file to start the server without tee
REM Usage: start-server-cmd [start|stop|restart]

setlocal enabledelayedexpansion

set ACTION=start
if not "%~1"=="" set ACTION=%~1

echo ========================================
echo   Spring Boot Server Manager
echo ========================================
echo.

if /i "%ACTION%"=="stop" (
    echo Stopping server...
    taskkill /F /IM java.exe 2>nul
    if !errorlevel! equ 0 (
        echo Server stopped.
    ) else (
        echo No running server found.
    )
    goto :end
)

if /i "%ACTION%"=="restart" (
    echo Restarting server...
    echo Stopping existing server...
    taskkill /F /IM java.exe 2>nul
    timeout /t 3 /nobreak >nul
    echo.
)

if /i "%ACTION%"=="start" (
    echo Starting server...
    echo ========================================
    echo.
    echo [1/2] Running gradlew clean...
    
    call ./gradlew clean
    if !errorlevel! neq 0 (
        echo.
        echo ERROR: Gradle clean failed!
        goto :end
    )
    
    echo.
    echo [2/2] Starting bootRun... (Press Ctrl+C to stop)
    echo ========================================
    echo.
    
    REM Run server and log output
    call ./gradlew bootRun 2^>^&1 | find /v "" 2^>nul
    
    echo.
    echo Server stopped.
    goto :end
)

echo Unknown action: %ACTION%
echo Usage: start-server-cmd [start^|stop^|restart]

:end
endlocal
echo.
pause