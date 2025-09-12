# Healthcare DApp AI Chat

This project is a decentralized healthcare application that integrates an AI chat component to facilitate communication between patients and healthcare providers. The application leverages blockchain technology for secure data management and AI for intelligent health insights.

## Project Structure

```
healthcare-dapp-ai-chat
├── public
│   ├── index.html          # Main HTML file for the application
│   └── manifest.json       # Metadata for Progressive Web App capabilities
├── src
│   ├── components          # React components for the application
│   │   ├── AIChat          # AI chat components
│   │   │   ├── AIChat.js   # Main chat interface
│   │   │   ├── ChatMessage.js # Individual chat message component
│   │   │   └── ChatInput.js # Input field for user messages
│   │   ├── Dashboard       # Components for patient and doctor dashboards
│   │   │   ├── PatientDashboard.js # Displays patient-specific information
│   │   │   └── DoctorDashboard.js  # Displays doctor-specific information
│   │   ├── Auth            # Authentication components
│   │   │   ├── LoginForm.js # Login form for users
│   │   │   └── RegisterForm.js # Registration form for new users
│   │   └── Layout          # Layout components
│   │       ├── Header.js   # Application header
│   │       └── Navbar.js    # Navigation bar
│   ├── contracts           # Smart contract files
│   │   └── Healthcare.json # ABI and contract address for the Healthcare contract
│   ├── services            # Services for blockchain and AI interactions
│   │   ├── blockchain.js   # Functions for blockchain interactions
│   │   ├── aiService.js    # Functions for AI service interactions
│   │   └── healthAnalytics.js # Functions for health data analysis
│   ├── hooks               # Custom hooks for managing state and logic
│   │   ├── useContract.js   # Hook for smart contract interactions
│   │   ├── useAIChat.js     # Hook for AI chat logic
│   │   └── useWallet.js      # Hook for wallet connections
│   ├── utils               # Utility functions and constants
│   │   ├── constants.js     # Constants used throughout the application
│   │   └── helpers.js       # Utility functions
│   ├── styles              # CSS styles
│   │   └── globals.css      # Global styles for the application
│   ├── App.js              # Main application component
│   └── index.js            # Entry point for the React application
├── package.json            # npm configuration file
├── .env.example            # Example environment variables
└── README.md               # Project documentation
```

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd healthcare-dapp-ai-chat
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Set up environment variables:**
   Copy the `.env.example` file to `.env` and update the values as needed.

4. **Run the application:**
   ```
   npm start
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000` to view the application.

## Usage Guidelines

- **AI Chat Component:** Users can interact with the AI chat component to ask health-related questions and receive intelligent responses.
- **Patient and Doctor Dashboards:** After logging in, users can access their respective dashboards to view and manage their health information.
- **Authentication:** New users can register, and existing users can log in to access the application features.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.