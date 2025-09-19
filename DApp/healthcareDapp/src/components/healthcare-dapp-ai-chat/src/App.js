import React, { useState } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import Header from "./components/Layout/Header";
import Navbar from "./components/Layout/Navbar";
import PatientDashboard from "./components/Dashboard/PatientDashboard";
import DoctorDashboard from "./components/Dashboard/DoctorDashboard";
import LoginForm from "./components/Auth/LoginForm";
import RegisterForm from "./components/Auth/RegisterForm";
import AIChat from "./components/AIChat/AIChat";
import "./styles/globals.css";

function App() {
  const [userRole, setUserRole] = useState(null); // To manage user role (patient or doctor)

  return (
    <Router>
      <Header />
      <Navbar setUserRole={setUserRole} />
      <Switch>
        <Route path="/" exact>
          <div>
            <h1>Welcome to Healthcare DApp</h1>
            
            {/* Copyright Footer - Only on Homepage */}
            <footer style={{
              backgroundColor: '#2c3e50',
              color: '#ecf0f1',
              textAlign: 'center',
              padding: '20px 0',
              marginTop: '40px',
              borderTop: '3px solid #3498db'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.5px'
              }}>
                © 2025 Healthcare DApp | Developed by <strong>MASTER BADRISH</strong>, B.Tech 4th Year (CSE)
                <br />
                <span style={{ fontSize: '12px', opacity: '0.8' }}>
                  Under supervision of Dr. Ditipriya, NIT Patna
                </span>
              </div>
            </footer>
          </div>
        </Route>
        <Route path="/login" component={LoginForm} />
        <Route path="/register" component={RegisterForm} />
        <Route path="/patient-dashboard" component={PatientDashboard} />
        <Route path="/doctor-dashboard" component={DoctorDashboard} />
        <Route path="/chat" component={AIChat} />
      </Switch>
    </Router>
  );
}

export default App;