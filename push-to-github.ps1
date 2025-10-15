# CivicPulse - Safe GitHub Push Guide
# Follow these steps carefully to push your project to GitHub

Write-Host "=== CivicPulse GitHub Push Guide ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check current directory
Write-Host "Step 1: Checking current directory..." -ForegroundColor Yellow
if (Test-Path "backend\server.js") {
    Write-Host "✓ You are in the correct directory" -ForegroundColor Green
} else {
    Write-Host "✗ Please navigate to the CivicPulse root directory first" -ForegroundColor Red
    Write-Host "Run: cd d:\23EG107E37\meanstacklab\civicpulse" -ForegroundColor Yellow
    exit
}

# Step 2: Check for .env files
Write-Host ""
Write-Host "Step 2: Checking for sensitive files..." -ForegroundColor Yellow
$envFiles = Get-ChildItem -Path . -Filter ".env" -Recurse -ErrorAction SilentlyContinue
if ($envFiles) {
    Write-Host "⚠ Warning: .env file(s) found - they will be ignored by .gitignore" -ForegroundColor Yellow
    $envFiles | ForEach-Object { Write-Host "  - $($_.FullName)" }
} else {
    Write-Host "✓ No .env files found" -ForegroundColor Green
}

# Step 3: Check node_modules
Write-Host ""
Write-Host "Step 3: Verifying node_modules is excluded..." -ForegroundColor Yellow
if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    if ($gitignoreContent -match "node_modules") {
        Write-Host "✓ node_modules will be excluded" -ForegroundColor Green
    }
}

# Step 4: Initialize git (if needed)
Write-Host ""
Write-Host "Step 4: Checking git repository..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Write-Host "✓ Git repository already initialized" -ForegroundColor Green
    $reinit = Read-Host "Do you want to start fresh? This will remove existing git history (y/N)"
    if ($reinit -eq "y" -or $reinit -eq "Y") {
        Remove-Item -Recurse -Force .git
        Write-Host "Removed existing .git folder" -ForegroundColor Yellow
        git init
        Write-Host "✓ Fresh git repository initialized" -ForegroundColor Green
    }
} else {
    Write-Host "Initializing new git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✓ Git repository initialized" -ForegroundColor Green
}

# Step 5: Check remote
Write-Host ""
Write-Host "Step 5: Configuring remote repository..." -ForegroundColor Yellow
$remoteUrl = "https://github.com/hemanthh35/CivicPulse.git"
$existingRemote = git remote get-url origin 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Current remote: $existingRemote" -ForegroundColor Yellow
    $changeRemote = Read-Host "Do you want to update the remote URL? (y/N)"
    if ($changeRemote -eq "y" -or $changeRemote -eq "Y") {
        git remote set-url origin $remoteUrl
        Write-Host "✓ Remote URL updated" -ForegroundColor Green
    }
} else {
    git remote add origin $remoteUrl
    Write-Host "✓ Remote origin added: $remoteUrl" -ForegroundColor Green
}

# Step 6: Stage files
Write-Host ""
Write-Host "Step 6: Staging files..." -ForegroundColor Yellow
git add .
Write-Host "✓ Files staged" -ForegroundColor Green

# Step 7: Show status
Write-Host ""
Write-Host "Step 7: Checking what will be committed..." -ForegroundColor Yellow
Write-Host "Files to be committed:" -ForegroundColor Cyan
git status --short

# Step 8: Commit
Write-Host ""
$commitMsg = Read-Host "Enter commit message (or press Enter for default)"
if ([string]::IsNullOrWhiteSpace($commitMsg)) {
    $commitMsg = "Add About page and update project documentation"
}

git commit -m $commitMsg
Write-Host "✓ Changes committed" -ForegroundColor Green

# Step 9: Branch setup
Write-Host ""
Write-Host "Step 9: Setting up main branch..." -ForegroundColor Yellow
git branch -M main
Write-Host "✓ Branch renamed to 'main'" -ForegroundColor Green

# Step 10: Push
Write-Host ""
Write-Host "Step 10: Ready to push to GitHub!" -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANT: You may need to authenticate with GitHub" -ForegroundColor Red
Write-Host "If this is your first push, GitHub may ask for credentials." -ForegroundColor Yellow
Write-Host ""
$push = Read-Host "Push to GitHub now? (Y/n)"

if ($push -eq "n" -or $push -eq "N") {
    Write-Host ""
    Write-Host "Push cancelled. When ready, run:" -ForegroundColor Yellow
    Write-Host "  git push -u origin main" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "✓ SUCCESS! Your code is now on GitHub!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "View your repository at:" -ForegroundColor Cyan
        Write-Host "https://github.com/hemanthh35/CivicPulse" -ForegroundColor Blue
    } else {
        Write-Host ""
        Write-Host "Push failed. Common issues:" -ForegroundColor Red
        Write-Host "1. Authentication required - Set up GitHub credentials" -ForegroundColor Yellow
        Write-Host "2. Repository not empty - Use: git push -u origin main --force" -ForegroundColor Yellow
        Write-Host "3. Network issues - Check your internet connection" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Script completed ===" -ForegroundColor Cyan
