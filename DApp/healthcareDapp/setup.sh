#!/bin/bash

# Healthcare DApp - Quick Setup Script
# This script automates the setup process for the Healthcare DApp

echo "🏥 Healthcare DApp - Quick Setup Script"
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if Node.js is installed
check_nodejs() {
    print_step "Checking Node.js installation..."
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version)
        print_status "Node.js found: $NODE_VERSION"
        
        # Check if version is 16+
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$NODE_MAJOR" -ge 16 ]; then
            print_status "Node.js version is compatible ✅"
        else
            print_warning "Node.js version should be 16+ for best compatibility"
        fi
    else
        print_error "Node.js not found! Please install Node.js 16+ from https://nodejs.org/"
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    print_step "Checking npm installation..."
    if command -v npm >/dev/null 2>&1; then
        NPM_VERSION=$(npm --version)
        print_status "npm found: $NPM_VERSION ✅"
    else
        print_error "npm not found! Please install npm"
        exit 1
    fi
}

# Install global dependencies
install_global_deps() {
    print_step "Installing global dependencies..."
    
    # Check if truffle is installed
    if ! command -v truffle >/dev/null 2>&1; then
        print_status "Installing Truffle..."
        npm install -g truffle
    else
        print_status "Truffle already installed ✅"
    fi
    
    # Check if ganache-cli is installed
    if ! command -v ganache-cli >/dev/null 2>&1; then
        print_status "Installing Ganache CLI..."
        npm install -g ganache-cli
    else
        print_status "Ganache CLI already installed ✅"
    fi
}

# Install project dependencies
install_project_deps() {
    print_step "Installing project dependencies..."
    
    # Main project dependencies
    print_status "Installing main project dependencies..."
    npm install
    
    # Client dependencies
    if [ -d "client" ]; then
        print_status "Installing client dependencies..."
        cd client
        npm install
        cd ..
    fi
    
    # API dependencies (Python)
    if [ -d "api" ] && [ -f "api/requirements.txt" ]; then
        print_status "Installing Python API dependencies..."
        if command -v python3 >/dev/null 2>&1; then
            cd api
            python3 -m pip install -r requirements.txt
            cd ..
        elif command -v python >/dev/null 2>&1; then
            cd api
            python -m pip install -r requirements.txt
            cd ..
        else
            print_warning "Python not found. API features may not work."
        fi
    fi
}

# Compile and deploy contracts
deploy_contracts() {
    print_step "Compiling and deploying smart contracts..."
    
    # Check if Ganache is running
    if ! curl -s http://127.0.0.1:7545 >/dev/null 2>&1; then
        print_warning "Ganache not detected on port 7545"
        print_status "Starting Ganache CLI..."
        ganache-cli --port 7545 --deterministic &
        GANACHE_PID=$!
        sleep 5
    fi
    
    # Compile contracts
    print_status "Compiling contracts..."
    truffle compile
    
    # Deploy contracts
    print_status "Deploying contracts..."
    truffle migrate --reset
    
    if [ $? -eq 0 ]; then
        print_status "Contracts deployed successfully ✅"
        print_warning "📝 Don't forget to update the contract address in src/config.js!"
    else
        print_error "Contract deployment failed!"
        exit 1
    fi
}

# Display final instructions
show_final_instructions() {
    echo ""
    echo "🎉 Setup Complete!"
    echo "=================="
    echo ""
    echo "📋 Next Steps:"
    echo "1. 🦊 Install MetaMask browser extension from https://metamask.io/"
    echo "2. 🔗 Add local network to MetaMask:"
    echo "   - Network Name: Ganache Local"
    echo "   - RPC URL: http://127.0.0.1:7545"
    echo "   - Chain ID: 1337"
    echo "   - Currency Symbol: ETH"
    echo ""
    echo "3. 💰 Import accounts from Ganache using private keys"
    echo "4. 📝 Update contract address in src/config.js"
    echo "5. 🚀 Start the application:"
    echo "   npm start"
    echo ""
    echo "📖 For detailed instructions, see SYSTEM_REQUIREMENTS.md"
    echo ""
    echo "🌐 Application will be available at: http://localhost:3000"
    echo "🔗 Ganache network: http://127.0.0.1:7545"
    echo ""
}

# Main execution
main() {
    echo "Starting automated setup..."
    echo ""
    
    check_nodejs
    check_npm
    install_global_deps
    install_project_deps
    deploy_contracts
    show_final_instructions
    
    echo "✅ Setup script completed successfully!"
}

# Run main function
main
