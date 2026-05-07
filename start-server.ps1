# Server startup script with error highlighting and restart capability
# Usage: .\start-server.ps1 [restart|stop|start]
# Examples:
#   .\start-server.ps1        # Start server
#   .\start-server.ps1 restart # Stop and restart server
#   .\start-server.ps1 stop    # Stop server

param(
    [string]$Action = "start"
)

function Stop-Server {
    Write-Host "`nStopping server..." -ForegroundColor Yellow
    if (Test-Path "build.gradle") {
        # Try graceful shutdown first (Ctrl+C equivalent)
        $processes = Get-Process -Name "java" -ErrorAction SilentlyContinue
        if ($processes) {
            Write-Host "Found Java processes. Stopping..." -ForegroundColor Yellow
            $processes | Stop-Process -Force
            Start-Sleep -Seconds 3
            Write-Host "Server stopped." -ForegroundColor Yellow
        } else {
            Write-Host "No running server found." -ForegroundColor Yellow
        }
    }
}

function Start-Server {
    Write-Host "Starting server..." -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    
    # Clean build first
    Write-Host "`nRunning gradlew clean..." -ForegroundColor Green
    & ./gradlew clean 2>&1 | ForEach-Object {
        if ($_ -imatch "error|exception|failed|could not") {
            Write-Host $_ -ForegroundColor Red -BackgroundColor Black
        } else {
            Write-Host $_
        }
        # Save to log file
        $_ | Out-File -FilePath "server.log" -Append -Encoding utf8
    }
    
    # Check if clean succeeded
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`nGradle clean failed with exit code $LASTEXITCODE" -ForegroundColor Red
        return $false
    }
    
    Write-Host "`nStarting bootRun..." -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    # Run the server with error monitoring and log to file
    & ./gradlew bootRun 2>&1 | Tee-Object -FilePath server.log -Append | ForEach-Object {
        if ($_ -imatch "error|exception|failed|could not|BUILD FAILED") {
            Write-Host $_ -ForegroundColor Red -BackgroundColor Black
        } elseif ($_ -imatch "started|Started|running|listening|port") {
            Write-Host $_ -ForegroundColor Green
        } else {
            Write-Host $_
        }
    }
    
    return $true
}

# Main execution
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Spring Boot Server Manager" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

switch ($Action.ToLower()) {
    "stop" {
        Stop-Server
        Write-Host "Server stopped successfully." -ForegroundColor Green
        exit 0
    }
    "restart" {
        Write-Host "Restarting server..." -ForegroundColor Yellow
        Stop-Server
        Start-Sleep -Seconds 2
        $result = Start-Server
    }
    "start" {
        $result = Start-Server
    }
    default {
        Write-Host "Unknown action: $Action" -ForegroundColor Red
        Write-Host "Usage: .\start-server.ps1 [start|stop|restart]" -ForegroundColor Yellow
        exit 1
    }
}

if (-not $result) {
    Write-Host "`nServer failed to start. Check server.log for details." -ForegroundColor Red
    exit 1
}

Write-Host "`nServer process completed." -ForegroundColor Green