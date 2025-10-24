#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Root build script for Love OKLCH project
.DESCRIPTION
    Coordinates build, test, and deployment across frontend, backend, and e2e folders
.PARAMETER Action
    The action to perform: build, test, e2e, lint, format, install, serve, seed
.PARAMETER Environment  
    The environment to build for: development, production
.EXAMPLE
    .\build.ps1 -Action build -Environment production
#>

param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("build", "test", "e2e", "lint", "format", "install", "serve", "seed")]
  [string]$Action,
    
  [Parameter(Mandatory = $false)]
  [ValidateSet("development", "production")]
  [string]$Environment = "development",
    
  [Parameter(Mandatory = $false)]
  [switch]$Watch = $false
)

$ProjectRoot = $PSScriptRoot
Set-Location $ProjectRoot

Write-Host "Love OKLCH Root Build Script" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host "Action: $Action" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Green
Write-Host "Project Root: $ProjectRoot" -ForegroundColor Green
Write-Host ""

function Invoke-FrontendAction {
  param([string]$FrontendAction)
    
  Write-Host "Running frontend action: $FrontendAction" -ForegroundColor Blue
  Set-Location "$ProjectRoot/frontend"
    
  $buildArgs = @("-Action", $FrontendAction)
  if ($Environment -ne "development") {
    $buildArgs += @("-Environment", $Environment)
  }
  if ($Watch) {
    $buildArgs += "-Watch"
  }
    
  & "$ProjectRoot/backend/scripts/build.ps1" @buildArgs
    
  Set-Location $ProjectRoot
}

function Invoke-BackendAction {
  param([string]$BackendAction)
    
  Write-Host "Running backend action: $BackendAction" -ForegroundColor Blue
  Set-Location "$ProjectRoot/backend"
    
  & "./scripts/seed-data.ps1" -Action $BackendAction
    
  Set-Location $ProjectRoot
}

function Invoke-E2EAction {
  Write-Host "Running E2E tests with Playwright..." -ForegroundColor Blue
  Set-Location "$ProjectRoot/e2e"
    
  # Ensure Playwright browsers are installed
  npx playwright install
    
  # Run tests
  npx playwright test
    
  Set-Location $ProjectRoot
}

# Main execution
try {
  switch ($Action) {
    "install" {
      Write-Host "Installing all dependencies..." -ForegroundColor Blue
            
      # Frontend dependencies
      Set-Location "$ProjectRoot/frontend"
      npm install
            
      # E2E dependencies (Playwright)
      Set-Location "$ProjectRoot/e2e"
      npm init -y
      npm install --save-dev @playwright/test
      npx playwright install
            
      Set-Location $ProjectRoot
      Write-Host "All dependencies installed!" -ForegroundColor Green
    }
    "build" { Invoke-FrontendAction "build" }
    "test" { Invoke-FrontendAction "test" }
    "lint" { Invoke-FrontendAction "lint" }
    "format" { Invoke-FrontendAction "format" }
    "serve" { Invoke-FrontendAction "serve" }
    "e2e" { Invoke-E2EAction }
    "seed" { Invoke-BackendAction "seed" }
  }
    
  Write-Host ""
  Write-Host "Root build script completed successfully!" -ForegroundColor Green
}
catch {
  Write-Error "Root build script failed: $_"
  exit 1
}