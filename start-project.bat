@echo off
echo ========================================
echo Information Exam Project Startup
echo ========================================
echo.

echo [1/3] Setting up database...
echo Please ensure PostgreSQL is running and 'information_exam' database exists.
echo Execute the DDL provided to create tables.
pause

echo.
echo [2/3] Starting Spring Boot backend...
cd /d C:\Users\SEOL\InformationExamProject
start cmd /k "mvn spring-boot:run"

echo.
echo [3/3] Starting React frontend...
cd /d C:\Users\SEOL\InformationExamProject\react-frontend
timeout /t 10 /nobreak > nul
start cmd /k "npm start"

echo.
echo ========================================
echo Servers are starting...
echo Backend: http://localhost:8080
echo Frontend: http://localhost:3000
echo ========================================
pause
