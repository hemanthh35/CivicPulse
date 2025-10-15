#!/bin/bash
# Render Build Script for CivicPulse

echo "=== Starting CivicPulse Build ==="

# Install root dependencies
echo "Installing backend dependencies..."
npm ci || npm install

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Build frontend
echo "Building Angular frontend..."
npm run build --configuration=production || npm run build

# Return to root
cd ..

echo "=== Build Complete ==="
