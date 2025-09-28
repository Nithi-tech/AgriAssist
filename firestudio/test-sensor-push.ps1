$body = @{
    Nitrogen = 94
    Phosphorus = 44
    Potassium = 163
    pH = 7.87
    soilMoisture = 44.5
} | ConvertTo-Json

Write-Host "🚀 Testing sensor data push..."
Write-Host "📊 Sending data:" $body

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/sensor-realtime" -Method POST -ContentType "application/json" -Body $body
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3)
    Write-Host ""
    Write-Host "🔗 You can now view the data at: http://localhost:3001/sensor-realtime" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Error:" $_.Exception.Message -ForegroundColor Red
    Write-Host "💡 Make sure your Next.js app is running on http://localhost:3001" -ForegroundColor Yellow
}
