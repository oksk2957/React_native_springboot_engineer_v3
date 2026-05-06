@echo off
echo Building Information Exam Project...
cd /d C:\Users\SEOL\InformationExamProject
echo Compiling Java sources...
mvn clean compile
echo Building React frontend...
cd react-frontend
call npm install
call npm run build
echo Build complete!
