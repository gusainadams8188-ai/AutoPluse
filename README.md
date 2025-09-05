# AutoPulse - Advanced Automotive Diagnostic System

A comprehensive, real-time automotive diagnostic dashboard featuring AI-powered analytics, OBD-II integration, and multi-manufacturer support.

## 🚀 Features

### Core Diagnostics
- Real-time vehicle metrics monitoring (RPM, speed, temperature, etc.)
- OBD-II adapter integration with custom command support
- DTC (Diagnostic Trouble Code) analysis and management
- Fuel economy tracking and optimization

### AI & Analytics
- Machine learning-powered anomaly detection
- Predictive maintenance recommendations
- Component lifespan estimation
- Fuel efficiency optimization with eco-driving scores

### Multi-Manufacturer Support
- OEM-specific diagnostics (Toyota, Ford, BMW, VW)
- Proprietary parameter monitoring
- Manufacturer-specific DTC codes
- Workshop integration and repair guides

### Advanced Features
- Plugin-based architecture for extensibility
- Real-time data streaming via Socket.io
- SQLite database with comprehensive vehicle data storage
- Responsive web interface with interactive charts

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Chart.js, Socket.io-client
- **Backend:** Node.js, Express, Socket.io
- **AI/ML:** TensorFlow.js, ML libraries
- **Database:** SQLite with better-sqlite3
- **Deployment:** Netlify (frontend), Railway (backend)

## 📊 Live Demo

Frontend: https://automotive-dashboard.netlify.app

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies: `npm install && cd client && npm install && cd ../server && npm install`
3. Start development: `npm run dev`
4. Access at http://localhost:5173

## 📝 License

ISC License
