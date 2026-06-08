# ============================================================================
# [2026-06-07] 전체 자동 설정 스크립트
# ============================================================================
# 실행 방법: PowerShell에서 .\setup-all.ps1 실행
# ============================================================================

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  정처기앱 전체 자동 설정" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$backendPath = $PSScriptRoot

# 1. .env 파일 확인
Write-Host "[1/5] .env 파일 확인 중..." -ForegroundColor Yellow
$envPath = Join-Path $backendPath ".env"
$templatePath = Join-Path $backendPath ".env.template"

if (-not (Test-Path $envPath)) {
    if (Test-Path $templatePath) {
        Copy-Item $templatePath $envPath
        Write-Host "✅ .env.template → .env 복사 완료" -ForegroundColor Green
        Write-Host "⚠ .env 파일을 열어서 실제 값을 입력하세요:" -ForegroundColor Yellow
        Write-Host "   경로: $envPath" -ForegroundColor Gray
        Write-Host ""
        Write-Host "필수 입력값:" -ForegroundColor Cyan
        Write-Host "  - SUPABASE_KEY: Supabase Dashboard → Settings → API → anon public" -ForegroundColor White
        Write-Host "  - SUPABASE_JWT_SECRET: Supabase Dashboard → Settings → API → JWT Secret" -ForegroundColor White
        Write-Host "  - JWT_SECRET: 위 JWT Secret과 동일한 값" -ForegroundColor White
        Write-Host ""

        # 메모장으로 .env 파일 열기
        $openEditor = Read-Host "메모장으로 .env 파일을 열까요? (y/n)"
        if ($openEditor -eq 'y' -or $openEditor -eq 'Y') {
            Start-Process notepad $envPath
            Write-Host ""
            Write-Host "⏳ .env 파일 수정 후 Enter를 누르세요..." -ForegroundColor Yellow
            Read-Host
        }
    } else {
        Write-Host "❌ .env.template 파일을 찾을 수 없습니다." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ .env 파일 존재" -ForegroundColor Green
}

# 2. .env 파일 읽기
Write-Host ""
Write-Host "[2/5] .env 파일 읽는 중..." -ForegroundColor Yellow
$envContent = Get-Content $envPath
$envVars = @{}
foreach ($line in $envContent) {
    if ($line -match "^([^#][^=]+)=(.*)$") {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        if (-not [string]::IsNullOrWhiteSpace($value)) {
            $envVars[$key] = $value
        }
    }
}

$supabaseUrl = $envVars["SUPABASE_URL"]
$supabaseKey = $envVars["SUPABASE_KEY"]
$jwtSecret = $envVars["SUPABASE_JWT_SECRET"]

if ([string]::IsNullOrEmpty($supabaseKey) -or $supabaseKey -eq "your_anon_key_here") {
    Write-Host "❌ .env 파일에 SUPABASE_KEY를 입력하세요." -ForegroundColor Red
    exit 1
}

if ([string]::IsNullOrEmpty($jwtSecret) -or $jwtSecret -eq "your_jwt_secret_here") {
    Write-Host "❌ .env 파일에 SUPABASE_JWT_SECRET을 입력하세요." -ForegroundColor Red
    exit 1
}

Write-Host "✅ 환경변수 로드 완료" -ForegroundColor Green

# 3. DB 스키마 수정
Write-Host ""
Write-Host "[3/5] DB 스키마 수정 중..." -ForegroundColor Yellow
Write-Host "      (subjective_problems 테이블에 option1~5 컬럼 추가)" -ForegroundColor Gray

$sql = @"
ALTER TABLE public.subjective_problems
ADD COLUMN IF NOT EXISTS option1 varchar(500),
ADD COLUMN IF NOT EXISTS option2 varchar(500),
ADD COLUMN IF NOT EXISTS option3 varchar(500),
ADD COLUMN IF NOT EXISTS option4 varchar(500),
ADD COLUMN IF NOT EXISTS option5 varchar(500);

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'subjective_problems'
ORDER BY ordinal_position;
"@

$headers = @{
    "apikey" = $supabaseKey
    "Authorization" = "Bearer $supabaseKey"
    "Content-Type" = "application/json"
    "Prefer" = "return=minimal"
}

$body = @{
    query = $sql
} | ConvertTo-Json -Compress

try {
    $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/rpc" -Method Post -Headers $headers -Body $body -ErrorAction Stop
    Write-Host "✅ DB 스키마 수정 완료!" -ForegroundColor Green
} catch {
    Write-Host "⚠ REST API 실패. SQL Editor에서 수동 실행 필요:" -ForegroundColor Yellow
    Write-Host "   Supabase Dashboard → SQL Editor → New Query" -ForegroundColor Gray
    Write-Host ""
    Write-Host $sql -ForegroundColor White
    Write-Host ""
    $continue = Read-Host "계속하시겠습니까? (y/n)"
    if ($continue -ne 'y' -and $continue -ne 'Y') {
        exit 1
    }
}

# 4. 기존 프로세스 종료
Write-Host ""
Write-Host "[4/5] 기존 백엔드 프로세스 종료 중..." -ForegroundColor Yellow
$processFound = $false
Get-Process java -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -match "information-exam" -or $_.CommandLine -match "spring-boot"
} | ForEach-Object {
    $processFound = $true
    Write-Host "   프로세스 종료: PID $($_.Id)" -ForegroundColor Gray
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

if (-not $processFound) {
    Write-Host "   실행 중인 프로세스 없음" -ForegroundColor Gray
} else {
    Write-Host "✅ 프로세스 종료 완료" -ForegroundColor Green
}

# 5. 백엔드 시작
Write-Host ""
Write-Host "[5/5] 백엔드 시작 중..." -ForegroundColor Yellow
Write-Host "      포트: 9001" -ForegroundColor Gray
Write-Host "      로그: $backendPath\server.log" -ForegroundColor Gray
Write-Host ""

# 로그 파일 초기화
$logFile = Join-Path $backendPath "server.log"
Set-Content -Path $logFile -Value "" -Encoding UTF8

# 백그라운드로 시작
$mvnwPath = Join-Path $backendPath "mvnw.cmd"
if (Test-Path $mvnwPath) {
    Start-Process -FilePath $mvnwPath -ArgumentList "spring-boot:run" -WorkingDirectory $backendPath -WindowStyle Hidden
    Write-Host "✅ 백엔드가 백그라운드에서 시작되었습니다." -ForegroundColor Green
    Write-Host ""
    Write-Host "로그 확인:" -ForegroundColor Cyan
    Write-Host "  Get-Content $logFile -Wait" -ForegroundColor White
    Write-Host ""
    Write-Host "중지:" -ForegroundColor Cyan
    Write-Host "  .\restart-backend.bat" -ForegroundColor White
} else {
    Write-Host "❌ mvnw.cmd를 찾을 수 없습니다." -ForegroundColor Red
    Write-Host "   수동 실행: cd $backendPath && mvnw.cmd spring-boot:run" -ForegroundColor Gray
}

# 완료 메시지
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  ✅ 전체 설정 완료!" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "다음 단계:" -ForegroundColor Yellow
Write-Host "  1. 로그 확인: Get-Content $logFile -Wait" -ForegroundColor White
Write-Host "  2. 앱 실행: InformationExamApp 폴더에서 npm start" -ForegroundColor White
Write-Host "  3. 테스트: http://localhost:9001/api/health" -ForegroundColor White
Write-Host ""
