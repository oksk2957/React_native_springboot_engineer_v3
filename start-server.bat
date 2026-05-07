@echo off
REM Server startup script with restart capability
REM Usage: start-server [start|stop|restart]

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
        echo Server stopped successfully.
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
    echo Running gradlew clean...
    
    call ./gradlew clean
    if !errorlevel! neq 0 (
        echo.
        echo Gradle clean failed!
        goto :end
    )
    
    echo.
    echo Starting bootRun...
    echo ========================================
    echo.
    
    REM Run server and pipe output with tee to log file
    call ./gradlew bootRun 2^>^&1 ^| tee.exe -a server.log
    
    goto :end
)

echo Unknown action: %ACTION%
echo Usage: start-server [start^|stop^|restart]

:end
endlocal