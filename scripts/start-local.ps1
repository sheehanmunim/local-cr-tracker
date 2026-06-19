param(
  [switch]$SetupOnly
)

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location -Path $Root

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Has-Command {
  param([string]$Name)
  return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Add-CommonPath {
  param([string]$PathToAdd)
  if ([System.IO.Directory]::Exists($PathToAdd) -and ($env:Path -notlike "*$PathToAdd*")) {
    $env:Path = "$PathToAdd;$env:Path"
  }
}

function Refresh-LocalPath {
  Add-CommonPath "$env:ProgramFiles\nodejs"
  Add-CommonPath "$env:LOCALAPPDATA\Programs\Ollama"
}

function Has-SupportedNode {
  if (-not (Has-Command "node")) {
    return $false
  }

  $version = (& node --version).Trim().TrimStart("v")
  $major = [int]($version.Split(".")[0])
  return $major -ge 20
}

function Require-Winget {
  if (-not (Has-Command "winget")) {
    throw "This script can install missing tools on Windows with winget, but winget was not found. Install App Installer from the Microsoft Store, then rerun this script."
  }
}

function Install-WithWinget {
  param(
    [string]$PackageId,
    [string]$Name
  )

  Require-Winget
  Write-Step "Installing $Name"
  winget install --id $PackageId --exact --accept-source-agreements --accept-package-agreements
  if ($LASTEXITCODE -ne 0) {
    throw "winget could not install $Name."
  }
  Refresh-LocalPath
}

Write-Host "Local CR Tracker bootstrap"
if ($SetupOnly) {
  Write-Host "This will install missing local prerequisites and pull the selected local models."
} else {
  Write-Host "This will install missing local prerequisites, pull the selected local models, and start the app."
}

Refresh-LocalPath

if (-not (Has-SupportedNode)) {
  Install-WithWinget -PackageId "OpenJS.NodeJS.LTS" -Name "Node.js LTS"
}

Refresh-LocalPath

if (-not (Has-SupportedNode)) {
  throw "Node.js 20 or newer is required, and the automatic install did not make it available in this terminal. Reopen PowerShell and rerun this script."
}

if (-not (Has-Command "npm")) {
  throw "Node.js was installed, but npm is not available in this terminal yet. Close and reopen PowerShell, then rerun .\scripts\start-local.ps1."
}

if (-not (Has-Command "ollama")) {
  Install-WithWinget -PackageId "Ollama.Ollama" -Name "Ollama"
}

Refresh-LocalPath

if ($SetupOnly) {
  Write-Step "Running setup"
  npm run setup
} else {
  Write-Step "Starting the app"
  npm run local
}
