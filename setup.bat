@echo off
REM Healthcare DApp - Windows Setup Script
REM This script automates the setup process for Windows users

echo.
echo 🏥 Healthcare DApp - Windows Setup Script
echo ==========================================
echo.

REM Check if Node.js is installed
echo [STEP] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Node.js found ✅
    node --version
) else (
    echo [ERROR] Node.js not found! Please install Node.js 16+ from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
echo [STEP] Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] npm found ✅
    npm --version
) else (
    echo [ERROR] npm not found! Please install npm
    pause
    exit /b 1
)

REM Install global dependencies
echo [STEP] Installing global dependencies...

REM Check if truffle is installed
truffle version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Installing Truffle...
    npm install -g truffle
) else (
    echo [INFO] Truffle already installed ✅
)

REM Check if ganache-cli is installed
ganache-cli --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Installing Ganache CLI...
    npm install -g ganache-cli
) else (
    echo [INFO] Ganache CLI already installed ✅
)

REM Install project dependencies
echo [STEP] Installing project dependencies...

echo [INFO] Installing main project dependencies...
npm install

REM Client dependencies
if exist "client" (
    echo [INFO] Installing client dependencies...
    cd client
    npm install
    cd ..
)

REM API dependencies (Python)
if exist "api\requirements.txt" (
    echo [INFO] Installing Python API dependencies...
    python --version >nul 2>&1
    if %errorlevel% equ 0 (
        cd api
        python -m pip install -r requirements.txt
        cd ..
    ) else (
        echo [WARNING] Python not found. API features may not work.
    )
)

REM Compile and deploy contracts
echo [STEP] Compiling and deploying smart contracts...

echo [INFO] Compiling contracts...
truffle compile

echo [INFO] Deploying contracts...
truffle migrate --reset

if %errorlevel% equ 0 (
    echo [INFO] Contracts deployed successfully ✅
    echo [WARNING] 📝 Don't forget to update the contract address in src/config.js!
) else (
    echo [ERROR] Contract deployment failed!
    pause
    exit /b 1
)

REM Display final instructions
echo.
echo 🎉 Setup Complete!
echo ==================
echo.
echo 📋 Next Steps:
echo 1. 🦊 Install MetaMask browser extension from https://metamask.io/
echo 2. 🔗 Add local network to MetaMask:
echo    - Network Name: Ganache Local
echo    - RPC URL: http://127.0.0.1:7545
echo    - Chain ID: 1337
echo    - Currency Symbol: ETH
echo.
echo 3. 💰 Import accounts from Ganache using private keys
echo 4. 📝 Update contract address in src/config.js
echo 5. 🚀 Start the application:
echo    npm start
echo.
echo 📖 For detailed instructions, see SYSTEM_REQUIREMENTS.md
echo.
echo 🌐 Application will be available at: http://localhost:3000
echo 🔗 Ganache network: http://127.0.0.1:7545
echo.
echo ✅ Setup script completed successfully!
echo.
pause
