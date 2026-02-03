# Herald DLT Service - Complete Test Suite
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "   Herald DLT Service Test Suite     " -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Get API Key
$apiKey = (cat .env | Select-String "^API_KEY=").ToString().Split('=')[1]
$headers = @{
    "Content-Type" = "application/json"
    "X-API-Key" = $apiKey
}

# Test 1: Health Check
Write-Host "`n[1/8] Testing Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3002/health"
    Write-Host "✓ Health check passed" -ForegroundColor Green
    $health | ConvertTo-Json
} catch {
    Write-Host "✗ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# Test 2: DLQ Count
Write-Host "`n[2/8] Getting DLQ Count..." -ForegroundColor Yellow
try {
    $count = Invoke-RestMethod -Uri "http://localhost:3002/api/v1/dlq/count" -Headers $headers
    Write-Host "✓ DLQ Count: $($count.count)" -ForegroundColor Green
    $count | ConvertTo-Json
} catch {
    Write-Host "✗ Failed to get count: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# Test 3: List DLQ Messages
Write-Host "`n[3/8] Listing DLQ Messages..." -ForegroundColor Yellow
try {
    $messages = Invoke-RestMethod -Uri "http://localhost:3002/api/v1/dlq?limit=5" -Headers $headers
    Write-Host "✓ Found $($messages.data.total) messages" -ForegroundColor Green
    $messages | ConvertTo-Json -Depth 5
} catch {
    Write-Host "✗ Failed to list messages: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# Test 4: Analytics
Write-Host "`n[4/8] Getting Analytics..." -ForegroundColor Yellow
try {
    $analytics = Invoke-RestMethod -Uri "http://localhost:3002/api/v1/analytics" -Headers $headers
    Write-Host "✓ Analytics retrieved" -ForegroundColor Green
    $analytics | ConvertTo-Json -Depth 5
} catch {
    Write-Host "✗ Failed to get analytics: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# Test 5: Statistics
Write-Host "`n[5/8] Getting Statistics (7 days)..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "http://localhost:3002/api/v1/analytics/statistics?days=7" -Headers $headers
    Write-Host "✓ Statistics retrieved" -ForegroundColor Green
    $stats | ConvertTo-Json -Depth 5
} catch {
    Write-Host "✗ Failed to get statistics: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# Test 6: Health Status
Write-Host "`n[6/8] Getting Health Status..." -ForegroundColor Yellow
try {
    $healthStatus = Invoke-RestMethod -Uri "http://localhost:3002/api/v1/analytics/health" -Headers $headers
    $healthy = $healthStatus.data.healthy
    $status = if($healthy){'HEALTHY'}else{'UNHEALTHY'}
    $color = if($healthy){'Green'}else{'Red'}
    Write-Host "✓ Health Status: $status" -ForegroundColor $color
    $healthStatus | ConvertTo-Json -Depth 5
} catch {
    Write-Host "✗ Failed to get health status: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# Test 7: Check if there's a message to replay
Write-Host "`n[7/8] Testing Replay (if messages exist)..." -ForegroundColor Yellow
try {
    $dlqCheck = Invoke-RestMethod -Uri "http://localhost:3002/api/v1/dlq?limit=1" -Headers $headers
    if ($dlqCheck.data.messages.Count -gt 0) {
        $correlationId = $dlqCheck.data.messages[0].correlationId
        Write-Host "Found message to replay: $correlationId" -ForegroundColor Cyan
        
        $replayResult = Invoke-RestMethod -Uri "http://localhost:3002/api/v1/dlq/$correlationId/replay" -Method Post -Headers $headers
        Write-Host "✓ Message replayed successfully" -ForegroundColor Green
        $replayResult | ConvertTo-Json
    } else {
        Write-Host "⊘ No messages in DLQ to replay" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Replay failed: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# Test 8: Service Status Summary
Write-Host "`n[8/8] Service Status Summary..." -ForegroundColor Yellow
try {
    $countResult = Invoke-RestMethod -Uri "http://localhost:3002/api/v1/dlq/count" -Headers $headers
    $healthResult = Invoke-RestMethod -Uri "http://localhost:3002/api/v1/analytics/health" -Headers $headers
    
    $summary = @{
        DLTService = "Running"
        Port = 3002
        DLQCount = $countResult.count
        HealthStatus = $healthResult.data.healthy
        Timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    }
    
    Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
    $summary | Format-Table -AutoSize
    Write-Host "✓ All tests completed" -ForegroundColor Green
} catch {
    Write-Host "✗ Summary failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "   Test Suite Complete                " -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
