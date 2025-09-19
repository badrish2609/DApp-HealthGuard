# 🏥 Healthcare DApp

A comprehensive blockchain-based healthcare management system with AI-powered risk assessment, secure messaging, and appointment scheduling.

## 🚀 Quick Start

### For Windows Users:
```bash
# Run the automated setup
setup.bat
```

### For macOS/Linux Users:
```bash
# Make script executable
chmod +x setup.sh

# Run the automated setup
./setup.sh
```

### Manual Setup:
```bash
# 1. Install dependencies
npm install

# 2. Start Ganache
npm run ganache

# 3. Deploy contracts (in new terminal)
npm run deploy

# 4. Start the application
npm start
```

## 📋 Prerequisites

- **Node.js** 16+ 
- **npm** 8+
- **MetaMask** browser extension
- **Python** 3.8+ (for AI features)

## 🎯 Features

- ✅ **Blockchain Registration** - Patient & Doctor registration on blockchain
- ✅ **Secure Authentication** - Smart contract-based login system
- ✅ **Appointment Management** - Blockchain-stored appointments
- ✅ **Secure Messaging** - End-to-end encrypted chat
- ✅ **AI Risk Assessment** - ML-powered health predictions
- ✅ **Email Notifications** - Automated appointment confirmations
- ✅ **Cross-system Compatibility** - Works across different devices

## 🔧 Configuration

After setup, update these files:

1. **Contract Address** in `src/config.js`
2. **Email Service** in `api/app.py` (optional)
3. **MetaMask Network** settings

## 📱 Usage

1. **Open**: http://localhost:3000
2. **Register** as Patient or Doctor
3. **Login** with your credentials
4. **Book appointments** and **chat securely**

## 🛠️ Available Scripts

- `npm start` - Start React application
- `npm run ganache` - Start local blockchain
- `npm run deploy` - Deploy smart contracts
- `npm run dev` - Start both Ganache and React
- `npm run api` - Start Python ML API

## 📖 Documentation

See `SYSTEM_REQUIREMENTS.md` for detailed setup instructions and troubleshooting.

## 🔒 Security

- All patient/doctor data stored on blockchain
- Messages encrypted end-to-end
- Smart contract-based authentication
- Private key management through MetaMask

## 🎨 Technology Stack

- **Frontend**: React.js, Material-UI
- **Blockchain**: Ethereum, Solidity, Truffle
- **Backend**: Python Flask (for ML)
- **Machine Learning**: Scikit-learn
- **Wallet**: MetaMask integration

---

**Built with ❤️ for secure healthcare management**
