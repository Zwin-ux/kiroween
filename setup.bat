@echo off
setlocal enabledelayedexpansion

echo 🎃 Welcome to KiroWeen Setup!
echo ================================

REM Check Node.js
echo 📋 Checking prerequisites...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

for /f "tokens=1 delims=." %%a in ('node --version') do (
    set NODE_MAJOR=%%a
    set NODE_MAJOR=!NODE_MAJOR:v=!
)

if !NODE_MAJOR! LSS 18 (
    echo ❌ Node.js version is too old. Please upgrade to Node.js 18+.
    pause
    exit /b 1
)

echo ✅ Node.js detected
node --version

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed.
    pause
    exit /b 1
)

echo ✅ npm detected
npm --version

REM Navigate to game directory
echo.
echo 📦 Installing dependencies...
cd haunted-debug-game

REM Install dependencies
npm install
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed

REM Run initial validation
echo.
echo 🧪 Running initial validation...

echo   - Type checking...
npx tsc --noEmit
if errorlevel 1 (
    echo ⚠️  Type checking failed (this is okay for development)
)

echo   - Linting...
npm run lint
if errorlevel 1 (
    echo ⚠️  Linting failed (this is okay for development)
)

echo   - Running tests...
npm test -- --watchAll=false --passWithNoTests
if errorlevel 1 (
    echo ⚠️  Tests failed (this is okay for development)
)

echo   - Validating assets...
npm run validate:assets
if errorlevel 1 (
    echo ⚠️  Asset validation failed (this is okay for development)
)

echo.
echo 🚀 Setup complete!
echo.
echo Next steps:
echo   1. Start development server: npm run dev
echo   2. Open http://localhost:3000 in your browser
echo   3. Read CONTRIBUTING.md for development guidelines
echo   4. Check out the visual demo at /visual-demo
echo.
echo Happy coding! 👻
pause