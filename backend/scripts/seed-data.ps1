#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Data seeding script for Love OKLCH project
.DESCRIPTION
    Creates seed data for 3 user types: designer, developer, admin with their respective color palettes and works
.PARAMETER Action
    The action to perform: seed, refresh, or reset
.EXAMPLE
    .\seed-data.ps1 -Action seed
#>

param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("seed", "refresh", "reset")]
  [string]$Action
)

$BackendRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $BackendRoot
$FrontendRoot = Join-Path $ProjectRoot "frontend"
Set-Location $ProjectRoot

Write-Host "Love OKLCH Data Seeding Script" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host "Action: $Action" -ForegroundColor Green
Write-Host ""

# Define seed data
$SeedData = @{
  Users         = @(
    @{
      id     = "user-001-designer"
      name   = "Alice Cooper"
      email  = "alice@example.com"
      type   = "designer"
      avatar = "https://via.placeholder.com/150/FF6B6B/FFFFFF?text=AC"
    },
    @{
      id     = "user-002-developer" 
      name   = "Bob Smith"
      email  = "bob@example.com"
      type   = "developer"
      avatar = "https://via.placeholder.com/150/4ECDC4/FFFFFF?text=BS"
    },
    @{
      id     = "user-003-admin"
      name   = "Carol Johnson"
      email  = "carol@example.com"  
      type   = "admin"
      avatar = "https://via.placeholder.com/150/45B7D1/FFFFFF?text=CJ"
    }
  )
    
  ColorPalettes = @{
    "user-001-designer"  = @(
      @{
        id        = "palette-001"
        name      = "Ocean Breeze"
        colors    = @(
          @{ l = 0.65; c = 0.15; h = 200; name = "Deep Ocean" },
          @{ l = 0.75; c = 0.12; h = 210; name = "Sky Blue" },
          @{ l = 0.85; c = 0.08; h = 220; name = "Cloud White" },
          @{ l = 0.45; c = 0.18; h = 190; name = "Sea Depth" },
          @{ l = 0.55; c = 0.14; h = 180; name = "Aqua" }
        )
        createdAt = "2024-10-01T10:00:00Z"
        updatedAt = "2024-10-20T15:30:00Z"
      },
      @{
        id        = "palette-002"
        name      = "Warm Sunset"
        colors    = @(
          @{ l = 0.7; c = 0.20; h = 45; name = "Golden Hour" },
          @{ l = 0.6; c = 0.25; h = 25; name = "Sunset Orange" },
          @{ l = 0.5; c = 0.22; h = 15; name = "Deep Amber" },
          @{ l = 0.8; c = 0.15; h = 55; name = "Light Gold" },
          @{ l = 0.4; c = 0.18; h = 10; name = "Burnt Sienna" }
        )
        createdAt = "2024-10-05T14:20:00Z"
        updatedAt = "2024-10-22T09:15:00Z"
      }
    )
        
    "user-002-developer" = @(
      @{
        id        = "palette-003"
        name      = "Code Syntax"
        colors    = @(
          @{ l = 0.15; c = 0.02; h = 240; name = "Editor Background" },
          @{ l = 0.9; c = 0.01; h = 0; name = "Text Primary" },
          @{ l = 0.6; c = 0.15; h = 120; name = "Success Green" },
          @{ l = 0.6; c = 0.18; h = 0; name = "Error Red" },
          @{ l = 0.7; c = 0.12; h = 240; name = "Info Blue" }
        )
        createdAt = "2024-09-28T08:45:00Z"
        updatedAt = "2024-10-18T16:20:00Z"
      },
      @{
        id        = "palette-004"
        name      = "Terminal Theme"
        colors    = @(
          @{ l = 0.1; c = 0.01; h = 0; name = "Terminal Black" },
          @{ l = 0.5; c = 0.12; h = 120; name = "Terminal Green" },
          @{ l = 0.6; c = 0.15; h = 60; name = "Terminal Yellow" },
          @{ l = 0.5; c = 0.14; h = 240; name = "Terminal Blue" },
          @{ l = 0.85; c = 0.02; h = 0; name = "Terminal White" }
        )
        createdAt = "2024-10-10T11:30:00Z"
        updatedAt = "2024-10-21T13:45:00Z"
      }
    )
        
    "user-003-admin"     = @(
      @{
        id        = "palette-005"
        name      = "Dashboard UI"
        colors    = @(
          @{ l = 0.95; c = 0.01; h = 0; name = "Background Light" },
          @{ l = 0.2; c = 0.02; h = 220; name = "Text Dark" },
          @{ l = 0.6; c = 0.12; h = 25; name = "Warning Orange" },
          @{ l = 0.5; c = 0.15; h = 0; name = "Danger Red" },
          @{ l = 0.4; c = 0.10; h = 220; name = "Primary Blue" }
        )
        createdAt = "2024-09-25T09:15:00Z"
        updatedAt = "2024-10-19T14:20:00Z"
      }
    )
  }
}

function Write-SeedFile {
  param(
    [string]$FileName,
    [object]$Data
  )
    
  $FilePath = Join-Path "frontend/src/assets/seed" $FileName
  $JsonData = $Data | ConvertTo-Json -Depth 10 -Compress
    
  # Ensure directory exists
  $Directory = Split-Path $FilePath -Parent
  if (!(Test-Path $Directory)) {
    New-Item -ItemType Directory -Path $Directory -Force | Out-Null
  }
    
  $JsonData | Out-File -FilePath $FilePath -Encoding UTF8
  Write-Host "Created: $FilePath" -ForegroundColor Green
}

function Invoke-Seed {
  Write-Host "Creating seed data files..." -ForegroundColor Blue
    
  # Create users seed file
  Write-SeedFile -FileName "users.json" -Data $SeedData.Users
    
  # Create color palettes for each user
  foreach ($UserId in $SeedData.ColorPalettes.Keys) {
    $User = $SeedData.Users | Where-Object { $_.id -eq $UserId }
    $UserType = $User.type
    $FileName = "palettes-$UserType.json"
    Write-SeedFile -FileName $FileName -Data $SeedData.ColorPalettes[$UserId]
  }
    
  # Create a combined seed file
  $CombinedData = @{
    users    = $SeedData.Users
    palettes = $SeedData.ColorPalettes
    metadata = @{
      version     = "1.0.0"
      createdAt   = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
      description = "Seed data for Love OKLCH application with 3 user types"
    }
  }
    
  Write-SeedFile -FileName "seed-data.json" -Data $CombinedData
    
  # Create TypeScript interfaces file
  $TsContent = @"
// Generated seed data interfaces
export interface SeedUser {
  id: string;
  name: string;
  email: string;
  type: 'sys' | 'admin' | 'group' | 'developer';
  avatar: string;
}

export interface SeedColor {
  l: number;
  c: number;
  h: number;
  name: string;
}

export interface SeedPalette {
  id: string;
  name: string;
  colors: SeedColor[];
  createdAt: string;
  updatedAt: string;
}

export interface SeedData {
  users: SeedUser[];
  palettes: { [userId: string]: SeedPalette[] };
  metadata: {
    version: string;
    createdAt: string;
    description: string;
  };
}
"@
    
  $TsPath = "frontend/src/app/core/models/seed-data.interface.ts"
  $TsContent | Out-File -FilePath $TsPath -Encoding UTF8
  Write-Host "Created: $TsPath" -ForegroundColor Green
    
  Write-Host ""
  Write-Host "Seed data created successfully!" -ForegroundColor Green
  Write-Host "Files created in: frontend/src/assets/seed/" -ForegroundColor Yellow
}

function Invoke-Refresh {
  Write-Host "Refreshing seed data..." -ForegroundColor Blue
    
  # Update timestamps
  $CurrentTime = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
    
  foreach ($UserId in $SeedData.ColorPalettes.Keys) {
    foreach ($Palette in $SeedData.ColorPalettes[$UserId]) {
      $Palette.updatedAt = $CurrentTime
    }
  }
    
  Invoke-Seed
  Write-Host "Seed data refreshed with updated timestamps!" -ForegroundColor Green
}

function Invoke-Reset {
  Write-Host "Resetting seed data..." -ForegroundColor Yellow
    
  $SeedPath = "frontend/src/assets/seed"
  if (Test-Path $SeedPath) {
    Remove-Item -Path $SeedPath -Recurse -Force
    Write-Host "Removed existing seed data directory." -ForegroundColor Yellow
  }
    
  $InterfacePath = "frontend/src/app/core/models/seed-data.interface.ts"
  if (Test-Path $InterfacePath) {
    Remove-Item -Path $InterfacePath -Force
    Write-Host "Removed seed data interface file." -ForegroundColor Yellow
  }
    
  Write-Host "Seed data reset completed!" -ForegroundColor Green
}

# Main execution
try {
  switch ($Action) {
    "seed" { Invoke-Seed }
    "refresh" { Invoke-Refresh }
    "reset" { Invoke-Reset }
  }
}
catch {
  Write-Error "Seed script failed: $_"
  exit 1
}