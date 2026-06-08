@echo off
chcp 65001 >nul
echo ============================================================
echo   백엔드 재시작 스크립트
echo ============================================================
echo.

:: 1. 기존 프로세스 종료
echo [1/3] 기존 백엔드 프로세스 확인 중...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :9001 ^| findstr LISTENING') do (
    echo 발견된 PID: %%a
    taskkill /PID %%a /F >nul 2>&1
    if errorlevel 1 (
        echo ⚠ 프로세스 %%a 종료 실패
    ) else (
        echo ✅ 프로세스 %%a 종료 완료
    )
)

:: 2. .env 파일 로드
echo.
echo [2/3] .env 파일 확인 중...
if exist .env (
    echo ✅ .env 파일 발견
) else (
    echo ⚠ .env 파일이 없습니다. .env.template을 복사하세요.
    if exist .env.template (
        copy .env.template .env >nul
        echo ✅ .env.template → .env 복사 완료
        echo ⚠ .env 파일을 열어서 실제 값을 입력하세요.
    )
)

:: 3. 백엔드 시작
echo.
echo [3/3] 백엔드 시작 중...
echo 포트: 9001
echo 로그: server.log
echo.
echo ============================================================
echo   Ctrl+C로 중단 가능
echo ============================================================
echo.

:: 로그 파일 초기화
echo. > server.log

:: 백엔드 실행 (로그를 server.log에 저장, 백그라운드)
echo [실행] 백엔드를 백그라운드로 시작합니다...
start /B cmd /c "call mvnw.cmd spring-boot:run > server.log 2>&1"

:: 시작 대기
echo [대기] 백엔드 시작 중... (약 15초)
timeout /t 15 /nobreak >nul

:: 포트 확인
echo.
echo [확인] 포트 9001 리스닝 확인 중...
netstat -ano | findstr :9001 | findstr LISTENING >nul 2>&1
if errorlevel 1 (
    echo ❌ 백엔드가 아직 시작되지 않았습니다. server.log를 확인하세요.
    echo.
    echo 최근 로그:
    type server.log | more
) else (
    echo ✅ 백엔드가 포트 9001에서 실행 중입니다.
    echo 📋 로그 파일: backend\server.log
)

echo.
echo ============================================================
echo   백엔드 재시작 완료
echo   로그 확인: tail -f backend\server.log
echo ============================================================
pause
