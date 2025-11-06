#!/bin/bash

# KiroWeen Setup Script
# Quick setup for new contributors

set -e

echo "🎃 Welcome to KiroWeen Setup!"
echo "================================"

# Check Node.js version
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please upgrade to Node.js 18+."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check npm version
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Navigate to game directory
echo ""
echo "📦 Installing dependencies..."
cd haunted-debug-game

# Install dependencies
npm install

echo "✅ Dependencies installed"

# Run initial validation
echo ""
echo "🧪 Running initial validation..."

# Type check
echo "  - Type checking..."
npx tsc --noEmit

# Lint check
echo "  - Linting..."
npm run lint

# Test run
echo "  - Running tests..."
npm test -- --watchAll=false --passWithNoTests

# Asset validation
echo "  - Validating assets..."
npm run validate:assets || echo "⚠️  Asset validation failed (this is okay for development)"

echo ""
echo "🚀 Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Start development server: npm run dev"
echo "  2. Open http://localhost:3000 in your browser"
echo "  3. Read CONTRIBUTING.md for development guidelines"
echo "  4. Check out the visual demo at /visual-demo"
echo ""
echo "Happy coding! 👻"