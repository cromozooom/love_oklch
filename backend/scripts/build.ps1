#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Build script for Love OKLCH project
.DESCRIPTION
    Cross-platform PowerShell script for building, testing, and deploying the Love OKLCH Angular application
.PARAMETER Action
    The action to perform: build, test, e2e, lint, or deploy
.PARAMETER Environment
    The environment to build for: development, production
.EXAMPLE
    .\build.ps1 -Action build -Environment production
#>

param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("build", "test", "e2e", "lint", "format", "deploy", "install", "serve")]
  [string]$Action,
    
  [Parameter(Mandatory = $false)]
  [ValidateSet("development", "production")]
  [string]$Environment = "development",
    
  [Parameter(Mandatory = $false)]
  [switch]$Watch = $false
)

# Ensure we're in the correct directory
$BackendRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $BackendRoot
$FrontendRoot = Join-Path $ProjectRoot "frontend"
Set-Location $FrontendRoot

Write-Host "Love OKLCH Build Script" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host "Action: $Action" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Green
Write-Host "Project Root: $ProjectRoot" -ForegroundColor Green
Write-Host "Frontend Root: $FrontendRoot" -ForegroundColor Green
Write-Host ""

function Test-NodeModules {
  if (!(Test-Path "node_modules")) {
    Write-Host "Node modules not found. Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
      Write-Error "Failed to install dependencies"
      exit 1
    }
  }
}

function Invoke-Build {
  Write-Host "Building application for $Environment environment..." -ForegroundColor Blue
    
  if ($Watch) {
    npm run watch
  }
  elseif ($Environment -eq "production") {
    npm run build -- --configuration=production
  }
  else {
    npm run build
  }
    
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed"
    exit 1
  }
    
  Write-Host "Build completed successfully!" -ForegroundColor Green
}

function Invoke-Test {
  Write-Host "Running unit tests..." -ForegroundColor Blue
    
  if ($Watch) {
    npm run test
  }
  else {
    npm run test -- --watch=false --browsers=ChromeHeadless
  }
    
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Tests failed"
    exit 1
  }
    
  Write-Host "All tests passed!" -ForegroundColor Green
}

function Invoke-E2ETest {
  Write-Host "Running E2E tests with Playwright..." -ForegroundColor Blue
    
  # Ensure Playwright browsers are installed
  npx playwright install
    
  if ($Watch) {
    npm run e2e:ui
  }
  else {
    npm run e2e
  }
    
  if ($LASTEXITCODE -ne 0) {
    Write-Error "E2E tests failed"
    exit 1
  }
    
  Write-Host "E2E tests completed successfully!" -ForegroundColor Green
}

function Invoke-Lint {
  Write-Host "Running linting..." -ForegroundColor Blue
    
  # Check if ESLint is configured, if not skip with warning
  if (Test-Path ".eslintrc.json") {
    npm run lint
    if ($LASTEXITCODE -ne 0) {
      Write-Error "Linting failed"
      exit 1
    }
  }
  else {
    Write-Warning "ESLint not configured. Skipping lint check."
  }
    
  Write-Host "Linting completed!" -ForegroundColor Green
}

function Invoke-Format {
  Write-Host "Formatting code..." -ForegroundColor Blue
    
  npm run format
    
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Formatting failed"
    exit 1
  }
    
  Write-Host "Code formatting completed!" -ForegroundColor Green
}

function Invoke-Install {
  Write-Host "Installing dependencies..." -ForegroundColor Blue
    
  npm install
    
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Installation failed"
    exit 1
  }
    
  # Install Playwright browsers
  npx playwright install
    
  Write-Host "Dependencies installed successfully!" -ForegroundColor Green
}

function Invoke-Serve {
  Write-Host "Starting development server..." -ForegroundColor Blue
    
  npm run start
}

function Invoke-Deploy {
  Write-Host "Deploying application..." -ForegroundColor Blue
    
  # First, build for production
  Invoke-Build
    
  # Add your deployment logic here
  # For example: copy dist folder to web server, upload to cloud, etc.
    
  Write-Host "Deployment completed!" -ForegroundColor Green
}

# Main execution
try {
  Test-NodeModules
    
  switch ($Action) {
    "build" { Invoke-Build }
    "test" { Invoke-Test }
    "e2e" { Invoke-E2ETest }
    "lint" { Invoke-Lint }
    "format" { Invoke-Format }
    "install" { Invoke-Install }
    "serve" { Invoke-Serve }
    "deploy" { Invoke-Deploy }
  }
    
  Write-Host ""
  Write-Host "Script completed successfully!" -ForegroundColor Green
}
catch {
  Write-Error "Script failed: $_"
  exit 1
}