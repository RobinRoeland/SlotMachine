# SlotMachine Setup Script for Windows
# This script helps beginners get started quickly

Write-Host ""
Write-Host "SlotMachine Setup Wizard" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-CommandExists {
    param($command)
    $null = Get-Command $command -ErrorAction SilentlyContinue
    return $?
}

# Step 1: Check Node.js
Write-Host "Step 1: Checking Node.js installation..." -ForegroundColor Yellow
if (Test-CommandExists node) {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js is installed: $nodeVersion" -ForegroundColor Green
    
    # Check version (should be 18+)
    $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($versionNumber -lt 18) {
        Write-Host "[WARNING] Node.js version 18 or higher is recommended" -ForegroundColor Yellow
        Write-Host "   Current version: $nodeVersion" -ForegroundColor Yellow
        Write-Host "   Download latest from: https://nodejs.org/" -ForegroundColor Yellow
    }
} else {
    Write-Host "[ERROR] Node.js is NOT installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "After installation, restart PowerShell and run this script again." -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Write-Host ""

# Step 2: Check npm
Write-Host "Step 2: Checking npm installation..." -ForegroundColor Yellow
if (Test-CommandExists npm) {
    $npmVersion = npm --version
    Write-Host "[OK] npm is installed: v$npmVersion" -ForegroundColor Green
} else {
    Write-Host "[ERROR] npm is NOT installed" -ForegroundColor Red
    Write-Host "   npm should come with Node.js. Please reinstall Node.js." -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Write-Host ""

# Step 3: Check if node_modules exists
Write-Host "Step 3: Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "[OK] Dependencies folder found" -ForegroundColor Green
    Write-Host ""
    $response = Read-Host "Dependencies are already installed. Reinstall? [y/N]"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Host "Installing dependencies..." -ForegroundColor Yellow
        npm install
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Dependencies installed successfully!" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] Installation failed. Please check the errors above." -ForegroundColor Red
            pause
            exit 1
        }
    }
} else {
    Write-Host "Installing dependencies (this may take 2-5 minutes)..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Dependencies installed successfully!" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Installation failed. Please check the errors above." -ForegroundColor Red
        pause
        exit 1
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the application, run:" -ForegroundColor Yellow
Write-Host "   npm start" -ForegroundColor White
Write-Host ""
Write-Host "For more information, see:" -ForegroundColor Yellow
Write-Host "   GETTING_STARTED.md - Beginner's guide" -ForegroundColor White
Write-Host "   README.md - Full documentation" -ForegroundColor White
Write-Host ""

$startResponse = Read-Host "Would you like to start the application now? [Y/n]"
if ($startResponse -ne 'n' -and $startResponse -ne 'N') {
    Write-Host ""
    Write-Host "Starting SlotMachine..." -ForegroundColor Green
    Write-Host "   The application will open at http://localhost:4200" -ForegroundColor Cyan
    Write-Host "   Press Ctrl+C to stop the server" -ForegroundColor Cyan
    Write-Host ""
    npm start
} else {
    Write-Host ""
    Write-Host "Setup complete! Run 'npm start' when you're ready." -ForegroundColor Green
    Write-Host ""
}
