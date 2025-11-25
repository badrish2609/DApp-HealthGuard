# Healthcare DApp - System Requirements & Setup Guide

## 📋 System Requirements

### **Operating System**
- **Windows**: Windows 10/11 (64-bit)
- **macOS**: macOS 10.15+ (Catalina or later)
- **Linux**: Ubuntu 18.04+ or equivalent distributions

### **Hardware Requirements**
- **RAM**: Minimum 8GB, Recommended 16GB
- **Storage**: At least 5GB free space
- **Processor**: Intel i5/AMD Ryzen 5 or better
- **Internet**: Stable broadband connection

---

## 🛠️ Required Software Installation

### **1. Node.js & npm**
```bash
# Download and install Node.js v16+ from: https://nodejs.org/
# Verify installation:
node --version    # Should show v16.0.0 or higher
npm --version     # Should show 8.0.0 or higher
```

### **2. Git (for version control)**
```bash
# Download from: https://git-scm.com/
# Verify installation:
git --version
```

### **3. Truffle Suite (Blockchain Development)**
```bash
npm install -g truffle
npm install -g ganache-cli

# Verify installation:
truffle version
ganache-cli --version
```

### **4. MetaMask Browser Extension**
- Install from: https://metamask.io/
- Available for Chrome, Firefox, Edge, Brave
- **Required for blockchain transactions**

---

## 🚀 Setup Instructions

### **Step 1: Clone/Extract the Project**
```bash
# If using Git:
git clone <repository-url>
cd healthcareDapp

# Or extract the provided ZIP file and navigate to the folder
```

### **Step 2: Install Dependencies**
```bash
# Install main project dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..

# Install API dependencies (for ML features)
cd api
pip install -r requirements.txt
cd ..
```

### **Step 3: Setup Local Blockchain (Ganache)**
```bash
# Option 1: Command Line
ganache-cli --port 7545 --deterministic

# Option 2: Ganache GUI (Recommended)
# Download from: https://trufflesuite.com/ganache/
# Create new workspace with port 7545
```

### **Step 4: Configure MetaMask**
1. **Add Local Network:**
   - Network Name: `Ganache Local`
   - RPC URL: `http://127.0.0.1:7545`
   - Chain ID: `1337`
   - Currency Symbol: `ETH`

2. **Import Accounts:**
   - Copy private keys from Ganache
   - Import at least 2-3 accounts for testing

### **Step 5: Deploy Smart Contracts**
```bash
# Compile contracts
truffle compile

# Deploy to local blockchain
truffle migrate --reset

# Verify deployment
truffle console
```

### **Step 6: Update Contract Addresses**
```bash
# After deployment, update these files with new contract address:
# - src/config.js
# - src/abi.js
# 
# Copy the deployed address from truffle migration output
```

### **Step 7: Start the Application**
```bash
# Terminal 1: Start React frontend
npm start
# Runs on: http://localhost:3000

# Terminal 2: Start Python API (optional, for ML features)
cd api
python app.py
# Runs on: http://localhost:5000
```

---

## 🔧 Configuration Files to Update

### **1. Contract Address (`src/config.js`)**
```javascript
const CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
```

### **2. Email Service (`api/app.py`)**
```python
# Update EmailJS configuration for appointment notifications
EMAIL_SERVICE_ID = "your_service_id"
EMAIL_TEMPLATE_ID = "your_template_id" 
EMAIL_PUBLIC_KEY = "your_public_key"
```

### **3. Network Configuration (`truffle-config.js`)**
```javascript
// Already configured for Ganache on port 7545
// No changes needed unless using different network
```

---

## 🧪 Testing the Setup

### **Test Checklist:**
1. ✅ **Blockchain Connection**: MetaMask shows connected to Ganache
2. ✅ **Patient Registration**: Can register new patients
3. ✅ **Doctor Registration**: Can register new doctors  
4. ✅ **Login System**: Both patient and doctor login work
5. ✅ **Appointment Booking**: Can schedule appointments
6. ✅ **Chat System**: Secure messaging works
7. ✅ **ML Risk Assessment**: AI predictions work (if API running)
8. ✅ **Email Notifications**: Appointment emails sent

### **Test Accounts:**
Use these for initial testing:
- **Patient**: ID will be auto-generated (P001, P002, etc.)
- **Doctor**: Use registration IDs like D001, D002, etc.

---

## 📱 Browser Requirements

### **Supported Browsers:**
- **Chrome** 90+ (Recommended)
- **Firefox** 90+
- **Edge** 90+
- **Brave** 1.20+

### **Required Browser Features:**
- JavaScript enabled
- MetaMask extension installed
- Local storage enabled
- WebAssembly support

---

## 🐛 Troubleshooting Guide

### **Common Issues & Solutions:**

#### **1. "Contract not deployed" Error**
```bash
# Solution: Redeploy contracts
truffle migrate --reset
# Update contract address in config files
```

#### **2. MetaMask Connection Issues**
```bash
# Solution: Reset MetaMask
# Settings > Advanced > Reset Account
# Re-import accounts from Ganache
```

#### **3. "Provider not found" Error**
```bash
# Solution: Check Ganache is running
ganache-cli --port 7545
# Ensure MetaMask points to http://127.0.0.1:7545
```

#### **4. Transaction Failures**
```bash
# Solution: Check account has enough ETH
# In Ganache, accounts start with 100 ETH
# If not, restart Ganache with --deterministic flag
```

#### **5. npm Installation Errors**
```bash
# Solution: Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## 📦 Project Structure Overview

```
healthcareDapp/
├── contracts/              # Smart contracts (.sol files)
├── migrations/             # Deployment scripts  
├── src/                   # React frontend source
│   ├── components/        # React components
│   ├── abi/              # Contract ABI files
│   └── config.js         # Configuration
├── api/                   # Python ML API
│   ├── models/           # Trained ML models
│   └── app.py           # Flask server
├── build/                 # Compiled contracts
├── client/               # Additional client files
├── test/                 # Contract tests
├── package.json          # Dependencies
└── truffle-config.js     # Truffle configuration
```

---

## 🔒 Security Notes

1. **Private Keys**: Never share private keys in production
2. **Local Development**: This setup is for development only
3. **Production Deployment**: Use testnets (Goerli, Sepolia) before mainnet
4. **Environment Variables**: Store sensitive data in .env files
5. **Contract Verification**: Verify contracts on block explorers

---

## 📞 Support & Contact

If you encounter any issues:
1. Check the troubleshooting guide above
2. Verify all requirements are met
3. Ensure correct versions are installed
4. Contact the development team with:
   - Error messages
   - System specifications
   - Steps to reproduce the issue

---

## 🔄 Updates & Maintenance

- **Regular Updates**: Keep Node.js, npm, and dependencies updated
- **Security Patches**: Monitor for security updates
- **Backup**: Regular backup of local blockchain data
- **Documentation**: Keep this guide updated with any changes

---

**Happy Development! 🚀**

*This Healthcare DApp combines blockchain security with AI-powered healthcare management.*
