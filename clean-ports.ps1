# [대한민국 1등 개발자 전용] 포트 및 프로세스 완전 소탕 스크립트 (최종 수정본)
# 사용법: .\clean-ports.ps1

Write-Host "`n🚀 [System] 포트 소독 작전을 시작합니다..." -ForegroundColor Cyan

# 1. 특정 포트(8081, 9001, 9000, 9057) 점유 프로세스 추적 및 사살
$targetPorts = @(8081, 9001, 9000, 9057)
foreach ($port in $targetPorts) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        # 중복된 PID 제거하여 고유 PID 목록 추출
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($pid in $pids) {
            try {
                $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Host "  - 포트 $port 점유자 (PID: $pid, Name: $($proc.Name)) 사살 중..." -ForegroundColor Yellow
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                }
            } catch {
                # 이미 종료된 프로세스 등 예외 처리
            }
        }
    }
}

# 2. 남아있는 모든 node 및 java 프로세스 일괄 종료
Write-Host "  - 남아있는 모든 Node 및 Java 프로세스 소탕 중..." -ForegroundColor Yellow
Stop-Process -Name "node", "java" -Force -ErrorAction SilentlyContinue

Write-Host "`n✨ 모든 장애물이 제거되었습니다. 이제 클린한 상태에서 서버를 시작하세요!" -ForegroundColor Green
Write-Host "==========================================================`n" -ForegroundColor Cyan
