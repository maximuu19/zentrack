# PowerShell Mini Web Server for ZenTrack
# Works on any Windows computer (PowerShell is built-in)

param(
    [int]$Port = 8000,
    [string]$Directory = "dist"
)

# Check if directory exists
if (-not (Test-Path $Directory)) {
    Write-Host "❌ Error: '$Directory' directory not found!" -ForegroundColor Red
    Write-Host "Please make sure you have the built version of ZenTrack."
    exit 1
}

# Function to find available port
function Get-AvailablePort {
    param([int]$StartPort = 8000)
    
    for ($port = $StartPort; $port -lt ($StartPort + 20); $port++) {
        try {
            $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $port)
            $listener.Start()
            $listener.Stop()
            return $port
        }
        catch {
            continue
        }
    }
    return $null
}

# Find available port
$AvailablePort = Get-AvailablePort -StartPort $Port
if ($null -eq $AvailablePort) {
    Write-Host "❌ Could not find an available port!" -ForegroundColor Red
    exit 1
}

Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host "🎯 ZenTrack PowerShell Server Starting..." -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host "📁 Serving directory: $Directory" -ForegroundColor Yellow
Write-Host "🌐 Server running at: http://localhost:$AvailablePort" -ForegroundColor Green
Write-Host "🖥️  Open your browser to: http://localhost:$AvailablePort" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Cyan
Write-Host "   - Bookmark the URL for easy access"
Write-Host "   - Works offline after first load"
Write-Host "   - Press Ctrl+C to stop the server"
Write-Host "=" * 50 -ForegroundColor Cyan

try {
    # Try to open browser automatically
    Start-Process "http://localhost:$AvailablePort"
    Write-Host "✅ Browser opened automatically!" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  Please open your browser manually" -ForegroundColor Yellow
}

Write-Host "🚀 ZenTrack is now running!" -ForegroundColor Green
Write-Host ""

# Simple HTTP Server using HttpListener
Add-Type -AssemblyName System.Net.Http

$http = [System.Net.HttpListener]::new()
$http.Prefixes.Add("http://localhost:$AvailablePort/")
$http.Start()

Write-Host "✅ Server started successfully!" -ForegroundColor Green
Write-Host "⏹️  Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

try {
    while ($http.IsListening) {
        $context = $http.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        # Get requested file path
        $requestedPath = $request.Url.AbsolutePath.TrimStart('/')
        if ([string]::IsNullOrEmpty($requestedPath) -or $requestedPath -eq '/') {
            $requestedPath = 'index.html'
        }
        
        $filePath = Join-Path $Directory $requestedPath
        
        if (Test-Path $filePath -PathType Leaf) {
            # Serve the file
            $content = [System.IO.File]::ReadAllBytes($filePath)
            
            # Set content type based on file extension
            $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
            switch ($extension) {
                '.html' { $response.ContentType = 'text/html; charset=utf-8' }
                '.css'  { $response.ContentType = 'text/css' }
                '.js'   { $response.ContentType = 'application/javascript' }
                '.json' { $response.ContentType = 'application/json' }
                '.png'  { $response.ContentType = 'image/png' }
                '.jpg'  { $response.ContentType = 'image/jpeg' }
                '.ico'  { $response.ContentType = 'image/x-icon' }
                default { $response.ContentType = 'application/octet-stream' }
            }
            
            # Prevent caching
            $response.Headers.Add('Cache-Control', 'no-cache, no-store, must-revalidate')
            $response.Headers.Add('Pragma', 'no-cache')
            $response.Headers.Add('Expires', '0')
            
            $response.ContentLength64 = $content.Length
            $response.StatusCode = 200
            $response.OutputStream.Write($content, 0, $content.Length)
        }
        else {
            # File not found
            $response.StatusCode = 404
            $notFoundContent = [System.Text.Encoding]::UTF8.GetBytes("File not found: $requestedPath")
            $response.ContentLength64 = $notFoundContent.Length
            $response.OutputStream.Write($notFoundContent, 0, $notFoundContent.Length)
        }
        
        $response.Close()
    }
}
catch [System.OperationCanceledException] {
    Write-Host "`n👋 ZenTrack server stopped. Goodbye!" -ForegroundColor Green
}
catch {
    Write-Host "`n❌ Server error: $_" -ForegroundColor Red
}
finally {
    if ($http.IsListening) {
        $http.Stop()
    }
    $http.Close()
}
