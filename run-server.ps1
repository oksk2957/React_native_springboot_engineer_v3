# Enhanced server runner with color-coded output and logging
# Usage: .\run-server.ps1 [restart|stop|start]

param(
    [ValidateSet("start", "stop", "restart")]
    [string]$Action = "start"
)

$LogFile = "server.log"
$ErrorPatterns = @("error", "exception", "failed", "could not", "BUILD FAILED", "FAILURE")
$SuccessPatterns = @("started", "Started", "running", "listening", "port", "successful")

function Write-Log {
    param([string]$Message)
    $Message | Out-File -FilePath $LogFile -Append -Encoding utf8
}

function Stop-Server {
    Write-Host "`nStopping server..." -ForegroundColor Yellow
    
    # Try to find and kill Gradle daemon and Java processes related to bootRun
    $javaProcs = Get-Process -Name "java" -ErrorAction SilentlyContinue | Where-Object {
        $_.MainWindowTitle -match "bootRun" -or ($_.Path -match "gradle" -and $_.MainWindowTitle -eq "")
    }
    
    if ($javaProcs) {
        $javaProcs | ForEach-Object {
            Write-Host "  Stopping process: $($_.Id) - $($_.ProcessName)" -ForegroundColor Yellow
            $_ | Stop-Process -Force
        }
        Start-Sleep -Seconds 3
        Write-Host "Server stopped." -ForegroundColor Green
    } else {
        Write-Host "  No running server processes found." -ForegroundColor DarkYellow
    }
    
    # Also kill Gradle daemons
    Write-Host "  Cleaning Gradle daemons..." -ForegroundColor DarkGray
    & ./gradlew --stop 2>&1 | Out-Null
}

function Start-Server {
    Write-Host "`nStarting Spring Boot Server..." -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    
    # Clear previous log
    if (Test-Path $LogFile) {
        Remove-Item $LogFile -Force
    }
    
    # Step 1: Clean
    Write-Host "`n[Step 1/2] Cleaning project..." -ForegroundColor Cyan
    $cleanOutput = & ./gradlew clean 2>&1
    $cleanOutput | ForEach-Object {
        $line = $_
        if ($ErrorPatterns | Where-Object { $line -imatch $_ }) {
            Write-Host $line -ForegroundColor Red -BackgroundColor Black
        } else {
            Write-Host $line
        }
        Write-Log -Message $line
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n❌ Gradle clean FAILED!" -ForegroundColor Red
        return $false
    }
    Write-Host "  ✅ Clean completed" -ForegroundColor Green
    
    # Step 2: Run
    Write-Host "`n[Step 2/2] Starting application..." -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    & ./gradlew bootRun 2>&1 | Tee-Object -FilePath $LogFile -Append | ForEach-Object {
        $line = $_
        
        if ($ErrorPatterns | Where-Object { $line -imatch $_ }) {
            Write-Host $line -ForegroundColor Red -BackgroundColor Black
        } elseif ($SuccessPatterns | Where-Object { $line -imatch $_ }) {
            Write-Host $line -ForegroundColor Green
        } elseif ($line -match "BUILD SUCCESS") {
            Write-Host $line -ForegroundColor Green
        } elseif ($line -match ">>>|<<<|---|\*\*\*") {
            Write-Host $line -ForegroundColor DarkGray
        } else {
            Write-Host $line
        }
    }
    
    return $true
}

# Main
switch ($Action) {
    "stop" {
        Stop-Server
        Write-Host "`n✅ Server stopped." -ForegroundColor Green
        exit 0
    }
    "restart" {
        Write-Host "🔄 Restarting server..." -ForegroundColor Yellow
        Stop-Server
        Start-Sleep -Seconds 2
        $success = Start-Server
    }
    "start" {
        $success = Start-Server
    }
}

if (-not $success) {
    Write-Host "`n❌ Server failed to start. Check $LogFile for details." -ForegroundColor Red
    Write-Host "   Log file: $(Resolve-Path $LogFile)" -ForegroundColor DarkGray
    exit 1
}

Write-Host "`n✅ Server process completed." -ForegroundColor Green