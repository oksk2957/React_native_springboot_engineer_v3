# ============================================================================
# [2026-06-07] Supabase DB 스키마 수정 및 환경변수 설정 자동화 스크립트
# ============================================================================
# 실행 방법: PowerShell에서 .\setup-supabase.ps1 실행
# ============================================================================

param(
    [string]$SupabaseUrl = "https://gmhznnwecujoafdisscl.supabase.co",
    [string]$SupabaseKey = "",
    [string]$JwtSecret = ""
)

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Supabase DB 스키마 수정 및 환경변수 설정" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Supabase Key 확인
if ([string]::IsNullOrEmpty($SupabaseKey)) {
    Write-Host "[1/4] Supabase anon key를 입력하세요:" -ForegroundColor Yellow
    Write-Host "      경로: Supabase Dashboard → Settings → API → Project API keys → anon public" -ForegroundColor Gray
    $SupabaseKey = Read-Host "> "
}

if ([string]::IsNullOrEmpty($SupabaseKey)) {
    Write-Host "❌ Supabase key가 필요합니다." -ForegroundColor Red
    exit 1
}

# 2. JWT Secret 확인
if ([string]::IsNullOrEmpty($JwtSecret)) {
    Write-Host ""
    Write-Host "[2/4] Supabase JWT Secret을 입력하세요:" -ForegroundColor Yellow
    Write-Host "      경로: Supabase Dashboard → Settings → API → JWT Settings → JWT Secret" -ForegroundColor Gray
    Write-Host "      ⚠️  anon key가 아닙니다!" -ForegroundColor Red
    $JwtSecret = Read-Host "> "
}

if ([string]::IsNullOrEmpty($JwtSecret)) {
    Write-Host "❌ JWT Secret이 필요합니다." -ForegroundColor Red
    exit 1
}

# 3. DB 스키마 수정 (SQL 실행)
Write-Host ""
Write-Host "[3/4] DB 스키마 수정 중..." -ForegroundColor Cyan

$sql = @"
ALTER TABLE public.subjective_problems
ADD COLUMN IF NOT EXISTS option1 varchar(500),
ADD COLUMN IF NOT EXISTS option2 varchar(500),
ADD COLUMN IF NOT EXISTS option3 varchar(500),
ADD COLUMN IF NOT EXISTS option4 varchar(500),
ADD COLUMN IF NOT EXISTS option5 varchar(500);

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'subjective_problems'
ORDER BY ordinal_position;
"@

$headers = @{
    "apikey" = $SupabaseKey
    "Authorization" = "Bearer $SupabaseKey"
    "Content-Type" = "application/json"
}

$body = @{
    query = $sql
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$SupabaseUrl/rest/v1/rpc" -Method Post -Headers $headers -Body $body
    Write-Host "✅ DB 스키마 수정 완료!" -ForegroundColor Green
    Write-Host "   option1~5 컬럼 추가됨" -ForegroundColor Gray
} catch {
    Write-Host "⚠️  REST API 실패, SQL Editor에서 수동 실행하세요." -ForegroundColor Yellow
    Write-Host "   Supabase Dashboard → SQL Editor → 다음 SQL 실행:" -ForegroundColor Gray
    Write-Host ""
    Write-Host $sql -ForegroundColor White
    Write-Host ""
}

# 4. .env 파일 생성
Write-Host ""
Write-Host "[4/4] .env 파일 생성 중..." -ForegroundColor Cyan

$envPath = Join-Path $PSScriptRoot ".env"
$envContent = @"
# Supabase Configuration
SUPABASE_URL=$SupabaseUrl
SUPABASE_KEY=$SupabaseKey
SUPABASE_JWT_SECRET=$JwtSecret

# Database (자동 설정됨)
DB_URL=jdbc:postgresql://aws-1-ap-south-1.pooler.supabase.com:6543/postgres?external_id=gmhznnwecujoafdisscl&prepareThreshold=0&options=-c%20client_encoding%3Dutf8&sslmode=require
DB_USERNAME=postgres.gmhznnwecujoafdisscl
DB_PASSWORD=wjdcjrlgkqrur

# JWT Configuration
JWT_SECRET=$JwtSecret
JWT_TOKEN_VALIDITY=43200
JWT_REFRESH_VALIDITY=86400

# Google OAuth (필요시 입력)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
"@

Set-Content -Path $envPath -Value $envContent -Encoding UTF8
Write-Host "✅ .env 파일 생성 완료!" -ForegroundColor Green
Write-Host "   경로: $envPath" -ForegroundColor Gray

# 완료 메시지
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  ✅ 설정 완료!" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "다음 단계:" -ForegroundColor Yellow
Write-Host "  1. 백엔드 재시작: .\restart-backend.ps1" -ForegroundColor White
Write-Host "  2. 또는 수동 재시작: ./mvnw.cmd spring-boot:run" -ForegroundColor Gray
Write-Host ""
Write-Host "참고:" -ForegroundColor Gray
Write-Host "  - .env 파일은 .gitignore에 포함되어 있습니다" -ForegroundColor Gray
Write-Host "  - JWT Secret은 Supabase Dashboard에서 확인하세요" -ForegroundColor Gray
Write-Host ""
