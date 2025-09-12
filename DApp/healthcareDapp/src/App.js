import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Paper,
  TextField,
  Snackbar,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import RiskAssessment from './components/RiskAssessment';
import { BrowserProvider, Contract, ethers } from "ethers";
import Healthcare from "./contracts/Healthcare.json";
import AIChat from "./components/AIChat";
import SecureChat from "./components/SecureChat";
import emailjs from '@emailjs/browser';

// Your deployed contract address
const contractAddress = "0x624167dE6AaC8D2Ec25718AfF5d80B671f927881";

// EmailJS Configuration 
const EMAIL_CONFIG = {
  SERVICE_ID: 'service_sddiug1', 
  TEMPLATE_ID: 'template_3io3lrn', 
  PUBLIC_KEY: 'yOM8Tdmd1zmqnySPW' 
};

// Initialize EmailJS
emailjs.init(EMAIL_CONFIG.PUBLIC_KEY);

// Updated getContract for ethers v6+
async function getContract() {
  if (!window.ethereum) throw new Error("MetaMask not detected");
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new Contract(contractAddress, Healthcare.abi, signer);
}

// Email notification function
const sendAppointmentNotification = async (appointmentData, patientEmail, setSnackbar) => {
  try {
    console.log("📧 Sending appointment notification email...");
    
    // Validate email
    if (!patientEmail || !patientEmail.includes('@')) {
      throw new Error("Invalid email address");
    }
    
    const templateParams = {
      to_name: appointmentData.patientName || "Patient",
      to_email: patientEmail,
      doctor_name: appointmentData.doctorName,
      appointment_date: appointmentData.date,
      appointment_time: appointmentData.time,
      appointment_reason: appointmentData.reason,
      patient_id: appointmentData.patientId,
      doctor_id: appointmentData.doctorId,
    };

    console.log("📧 Sending with params:", templateParams);

    const response = await emailjs.send(
      EMAIL_CONFIG.SERVICE_ID,
      EMAIL_CONFIG.TEMPLATE_ID,
      templateParams
    );

    if (response.status === 200) {
      console.log("✅ Email sent successfully!");
      setSnackbar({
        open: true,
        message: "📧 Appointment notification sent to patient's email!",
        severity: "success",
      });
      return true;
    } else {
      throw new Error("Failed to send email");
    }
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    setSnackbar({
      open: true,
      message: "⚠️ Appointment booked but email notification failed: " + error.message,
      severity: "warning",
    });
    return false;
  }
};

// Helper to ensure wallet is connected
async function ensureWalletConnected(setSnackbar, setLoading) {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask not detected. Please install MetaMask extension.");
    }

    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    
    if (!accounts || accounts.length === 0) {
      setSnackbar({
        open: true,
        message: "Requesting wallet connection...",
        severity: "info",
      });

      const newAccounts = await window.ethereum.request({ 
        method: "eth_requestAccounts" 
      });
      
      if (!newAccounts || newAccounts.length === 0) {
        throw new Error("No accounts found. Please create an account in MetaMask.");
      }
      
      console.log("Wallet connected:", newAccounts[0]);
    }
    
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    console.log("Connected to chain:", chainId);
    
    return true;
  } catch (err) {
    if (err.code === 4001) {
      throw new Error("Please connect your MetaMask wallet to continue.");
    } else if (err.code === -32002) {
      setSnackbar({
        open: true,
        message: "MetaMask connection request pending. Please check your wallet.",
        severity: "warning",
      });
      throw err;
    } else {
      throw err;
    }
  }
}

function App() {
  const [page, setPage] = useState("home");
  const [registerRole, setRegisterRole] = useState("");
  const [loginRole, setLoginRole] = useState("");
  const [patient, setPatient] = useState({ name: "", disease: "", dob: "", mobile: "", email: "", sbp: "", sugar: "", password: "" });
  const [doctor, setDoctor] = useState({ name: "", regId: "", phone: "", password: "" });
  const [loginPatient, setLoginPatient] = useState({ id: "", password: "" });
  const [loginDoctor, setLoginDoctor] = useState({ doctorId: "", password: "" });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [assignedPatientId, setAssignedPatientId] = useState("");
  const [assignedDoctorId, setAssignedDoctorId] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [patientDashboard, setPatientDashboard] = useState(null);
  const [doctorDashboard, setDoctorDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // State variables for patient search and appointments
  const [searchPatientId, setSearchPatientId] = useState("");
  const [searchedPatient, setSearchedPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [appointmentForm, setAppointmentForm] = useState({
    patientId: "",
    date: "",
    time: "",
    reason: ""
  });
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  
  // New states for patient appointment requests
  const [appointmentRequests, setAppointmentRequests] = useState([]);
  const [patientRequestForm, setPatientRequestForm] = useState({
    date: "",
    time: "",
    reason: "",
    preferredDoctor: ""
  });
  const [showPatientRequestForm, setShowPatientRequestForm] = useState(false);

  // Registered doctors state
  const [registeredDoctors, setRegisteredDoctors] = useState([]);

  // Delete appointment states
  const [deleteDialog, setDeleteDialog] = useState({ open: false, appointmentId: null });

  // Chat notification state
  const [chatNotifications, setChatNotifications] = useState([]);
  
  // Handle chat notifications
  const handleChatNotification = (notification) => {
    // Only handle notifications intended for the current user
    const currentUserId = userRole === 'patient' ? currentUser?.id : currentUser?.regId;
    
    // Check if notification is for current user by comparing recipient info
    const isForCurrentUser = (
      notification.recipientId === currentUserId || 
      notification.recipientType === userRole ||
      (notification.senderType !== userRole) // Show notifications from opposite user type
    );
    
    if (isForCurrentUser && currentUser && userRole) {
      setChatNotifications(prev => [...prev, notification]);
      
      // Show snackbar for new messages only for the correct recipient
      if (notification.type === 'new_message' && notification.senderType !== userRole) {
        setSnackbar({
          open: true,
          message: `💬 New message from ${notification.from}`,
          severity: "info"
        });
      }
    }
  };

  // Load appointments and requests on component mount
  useEffect(() => {
    loadAppointments();
    loadAppointmentRequests();
    loadRegisteredDoctors();
  }, []);

  // Load requests when user role changes
  useEffect(() => {
    if (userRole) {
      loadAppointmentRequests();
      loadAppointments();
      loadRegisteredDoctors();
    }
  }, [userRole]);

  // Function to load registered doctors from blockchain
  const loadRegisteredDoctors = async () => {
    try {
      if (!window.ethereum) return;
      
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(contractAddress, Healthcare.abi, provider);
      
      // Get the number of registered doctors
      const doctorCount = await contract.doctorCount();
      const doctors = [];
      
      // Get all doctor IDs from the doctorIds array
      for (let i = 0; i < doctorCount; i++) {
        try {
          const doctorId = await contract.doctorIds(i);
          const doctorInfo = await contract.getDoctorByRegId(doctorId);
          
          doctors.push({
            id: doctorId,
            name: doctorInfo[0], // name
            regId: doctorInfo[1], // regId
            phone: doctorInfo[2]  // phone
          });
        } catch (error) {
          console.log(`Error loading doctor at index ${i}:`, error);
        }
      }
      
      setRegisteredDoctors(doctors);
      console.log("Loaded registered doctors:", doctors);
    } catch (error) {
      console.error("Error loading registered doctors:", error);
    }
  };

  // Navigation handler
  const handleNav = (target) => {
    setPage(target);
    setRegisterRole("");
    setLoginRole("");
    setShowSuccess(false);
    setAssignedPatientId("");
    setAssignedDoctorId("");
    setPatientDashboard(null);
    setDoctorDashboard(null);
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null);
    setUserRole(null);
    setPatientDashboard(null);
    setDoctorDashboard(null);
    setChatNotifications([]);
    setAppointments([]);
    setAppointmentRequests([]);
    setSearchedPatient(null);
    setSearchPatientId("");
    setPage("home");
    
    setSnackbar({
      open: true,
      message: "Successfully logged out!",
      severity: "success"
    });
  };

  // Patient Search Function for Doctors - Blockchain Only
  const searchPatientById = async () => {
    if (!searchPatientId.trim()) {
      setSnackbar({ open: true, message: "Please enter a Patient ID", severity: "error" });
      return;
    }

    setLoading(true);
    try {
      const contract = await getContract();
      
      // Add timeout to blockchain search
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Patient search timeout")), 30000) // 30 seconds for blockchain calls
      );
      
      const infoPromise = contract.getPatientById(searchPatientId);
      const info = await Promise.race([infoPromise, timeout]);
      
      const patientInfo = {
        id: info[0],
        name: info[1],
        disease: info[2],
        dob: info[3],
        mobile: info[4],
        email: info[5],
        sbp: info[6],
        sugar: info[7],
      };
      
      setSearchedPatient(patientInfo);
      setSnackbar({ open: true, message: "Patient found on blockchain!", severity: "success" });
    } catch (error) {
      console.error("Blockchain search failed:", error);
      setSnackbar({ open: true, message: "Patient not found on blockchain", severity: "error" });
      setSearchedPatient(null);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced Appointment Booking Function with Email Notification
  const bookAppointment = async () => {
    if (!appointmentForm.patientId || !appointmentForm.date || !appointmentForm.time) {
      setSnackbar({ open: true, message: "Please fill all required fields", severity: "error" });
      return;
    }

    setLoading(true);
    try {
      // First, get patient details from blockchain for email notification
      let patientEmail = "";
      let patientName = "";
      
      console.log("📋 Fetching patient details for email notification...");
      
      if (searchedPatient && searchedPatient.id === appointmentForm.patientId) {
        // Use already searched patient data
        patientEmail = searchedPatient.email;
        patientName = searchedPatient.name;
        console.log("📧 Using cached patient data:", patientName, patientEmail);
      } else {
        // Search for patient details from blockchain
        try {
          const contract = await getContract();
          const timeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Patient search timeout")), 30000)
          );
          
          const infoPromise = contract.getPatientById(appointmentForm.patientId);
          const info = await Promise.race([infoPromise, timeout]);
          
          patientEmail = info[5]; // email is at index 5
          patientName = info[1]; // name is at index 1
          
          console.log("📧 Fetched patient data from blockchain:", patientName, patientEmail);
        } catch (error) {
          console.warn("Could not fetch patient details for email notification:", error);
          // Continue with appointment booking even if email fetch fails
        }
      }

      // Create appointment object
      const appointment = {
        id: Date.now(),
        patientId: appointmentForm.patientId,
        patientName: patientName,
        doctorId: currentUser?.regId || "Unknown",
        doctorName: currentUser?.name || "Unknown",
        date: appointmentForm.date,
        time: appointmentForm.time,
        reason: appointmentForm.reason || "General consultation",
        status: "scheduled",
        createdAt: new Date().toISOString()
      };

      // Save appointment to blockchain
      console.log("💾 Storing appointment on blockchain...");
      const contract = await getContract();
      
      const tx = await contract.createAppointment(
        appointmentForm.patientId,    // patientId
        patientName,                  // patientName  
        currentUser?.regId || "Unknown", // doctorId
        currentUser?.name || "Unknown",  // doctorName
        appointmentForm.date,         // date
        appointmentForm.time,         // time
        appointmentForm.reason || "General consultation", // reason
        "scheduled",                  // status
        false                         // fromRequest (doctor scheduled)
      );
      
      console.log("🔄 Transaction sent:", tx.hash);
      await tx.wait();
      console.log("✅ Appointment stored on blockchain");

      // Also save to localStorage for backward compatibility and quick access
      const existingAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      existingAppointments.push(appointment);
      localStorage.setItem('appointments', JSON.stringify(existingAppointments));

      setAppointments(existingAppointments);
      
      // Send email notification if patient email is available
      if (patientEmail && patientEmail !== "Not specified" && patientEmail.includes("@")) {
        console.log("📧 Attempting to send email notification...");
        
        setSnackbar({ 
          open: true, 
          message: "📅 Appointment booked! Sending email notification...", 
          severity: "info" 
        });
        
        await sendAppointmentNotification(appointment, patientEmail, setSnackbar);
      } else {
        console.log("📧 No valid email found for patient");
        setSnackbar({ 
          open: true, 
          message: "📅 Appointment booked! (No email available for notification)", 
          severity: "success" 
        });
      }
      
      // Clear form and refresh appointments
      setAppointmentForm({
        patientId: "",
        date: "",
        time: "",
        reason: ""
      });
      setShowAppointmentForm(false);
      loadAppointments();
      
    } catch (error) {
      console.error("Appointment booking error:", error);
      setSnackbar({ open: true, message: "Booking failed: " + error.message, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  // New function for patients to submit appointment requests
  const submitAppointmentRequest = async () => {
    if (!patientRequestForm.date || !patientRequestForm.time) {
      setSnackbar({ open: true, message: "Please select both date and time", severity: "error" });
      return;
    }

    setLoading(true);
    try {
      // Extract doctor ID and name from selected value
      let doctorId = "";
      let doctorName = "";
      
      if (patientRequestForm.preferredDoctor) {
        // Parse the selected value "Doctor Name (D001)" to extract ID and name
        const match = patientRequestForm.preferredDoctor.match(/^(.+) \(([A-Z]\d{3})\)$/);
        if (match) {
          doctorName = match[1];
          doctorId = match[2];
        } else {
          doctorName = patientRequestForm.preferredDoctor;
        }
      }

      // Create appointment request object
      const appointmentRequest = {
        id: Date.now(),
        patientId: currentUser?.id || "",
        patientName: currentUser?.name || "",
        patientEmail: currentUser?.email || "",
        patientMobile: currentUser?.mobile || "",
        date: patientRequestForm.date,
        time: patientRequestForm.time,
        reason: patientRequestForm.reason || "General consultation",
        preferredDoctor: patientRequestForm.preferredDoctor || "Any available doctor",
        preferredDoctorId: doctorId,
        preferredDoctorName: doctorName,
        status: "pending",
        requestedAt: new Date().toISOString()
      };

      // Store appointment request on blockchain
      console.log("💾 Storing appointment request on blockchain...");
      const contract = await getContract();
      
      const tx = await contract.createAppointment(
        currentUser?.id || "",        // patientId
        currentUser?.name || "",      // patientName
        doctorId || "PENDING",        // doctorId (use PENDING if no specific doctor)
        doctorName || "Pending Assignment", // doctorName
        patientRequestForm.date,      // date
        patientRequestForm.time,      // time
        patientRequestForm.reason || "General consultation", // reason
        "pending",                    // status
        true                          // fromRequest (patient requested)
      );
      
      console.log("🔄 Transaction sent:", tx.hash);
      await tx.wait();
      console.log("✅ Appointment request stored on blockchain");

      // Also save appointment request to localStorage for backward compatibility
      const existingRequests = JSON.parse(localStorage.getItem('appointmentRequests') || '[]');
      existingRequests.push(appointmentRequest);
      localStorage.setItem('appointmentRequests', JSON.stringify(existingRequests));

      setAppointmentRequests(existingRequests);
      
      setSnackbar({ 
        open: true, 
        message: "📅 Appointment request submitted successfully! Doctors will review your request and you'll receive an email confirmation when approved.", 
        severity: "success" 
      });
      
      // Clear form
      setPatientRequestForm({
        date: "",
        time: "",
        reason: "",
        preferredDoctor: ""
      });
      setShowPatientRequestForm(false);
      loadAppointmentRequests();
      
    } catch (error) {
      console.error("Appointment request error:", error);
      setSnackbar({ open: true, message: "Request failed: " + error.message, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Function to load appointment requests
  const loadAppointmentRequests = () => {
    try {
      const requests = JSON.parse(localStorage.getItem('appointmentRequests') || '[]');
      setAppointmentRequests(requests);
    } catch (error) {
      console.error("Error loading appointment requests:", error);
      setAppointmentRequests([]);
    }
  };

  // Function for doctors to approve appointment requests
  const approveAppointmentRequest = async (requestId) => {
    setLoading(true);
    try {
      const allRequests = JSON.parse(localStorage.getItem('appointmentRequests') || '[]');
      const requestToApprove = allRequests.find(req => req.id === requestId);
      
      if (!requestToApprove) {
        setSnackbar({ open: true, message: "Request not found!", severity: "error" });
        return;
      }

      // Check if a specific doctor was requested and if current doctor is authorized
      if (requestToApprove.preferredDoctorId && 
          requestToApprove.preferredDoctorId !== currentUser?.regId) {
        setSnackbar({ 
          open: true, 
          message: `This appointment was requested specifically for ${requestToApprove.preferredDoctorName} (${requestToApprove.preferredDoctorId}). Only they can approve this request.`, 
          severity: "warning" 
        });
        setLoading(false);
        return;
      }

      // Show progress message
      setSnackbar({ 
        open: true, 
        message: "Approving appointment request...", 
        severity: "info" 
      });

      // Update request status to approved
      const updatedRequests = allRequests.map(req => 
        req.id === requestId ? { ...req, status: 'approved', approvedBy: currentUser?.name, approvedAt: new Date().toISOString() } : req
      );
      localStorage.setItem('appointmentRequests', JSON.stringify(updatedRequests));

      // Create actual appointment with proper doctor assignment
      const appointment = {
        id: Date.now(),
        patientId: requestToApprove.patientId,
        patientName: requestToApprove.patientName,
        doctorId: currentUser?.regId || "",
        doctorName: currentUser?.name || "",
        date: requestToApprove.date,
        time: requestToApprove.time,
        reason: requestToApprove.reason,
        status: "scheduled",
        createdAt: new Date().toISOString(),
        fromRequest: true
      };

      const existingAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      existingAppointments.push(appointment);
      localStorage.setItem('appointments', JSON.stringify(existingAppointments));

      setAppointmentRequests(updatedRequests);
      setAppointments(existingAppointments);
      
      // Send email notification to patient if email is available
      const patientEmail = requestToApprove.patientEmail;
      if (patientEmail && patientEmail !== "Not specified" && patientEmail.includes("@")) {
        console.log("📧 Sending appointment approval notification to:", patientEmail);
        
        setSnackbar({ 
          open: true, 
          message: `✅ Appointment approved for ${requestToApprove.patientName}! Sending email notification...`, 
          severity: "info" 
        });
        
        try {
          await sendAppointmentNotification(appointment, patientEmail, setSnackbar);
          
          setSnackbar({ 
            open: true, 
            message: `✅ Appointment approved and email sent to ${requestToApprove.patientName}!`, 
            severity: "success" 
          });
        } catch (emailError) {
          console.error("Email notification failed:", emailError);
          
          setSnackbar({ 
            open: true, 
            message: `✅ Appointment approved for ${requestToApprove.patientName}! (Email notification failed: ${emailError.message})`, 
            severity: "warning" 
          });
        }
      } else {
        console.log("📧 No valid email found for patient notification");
        
        setSnackbar({ 
          open: true, 
          message: `✅ Appointment approved for ${requestToApprove.patientName}! (No email available for notification)`, 
          severity: "success" 
        });
      }
      
    } catch (error) {
      console.error("Error approving request:", error);
      setSnackbar({ open: true, message: "Failed to approve request: " + error.message, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Function for doctors to reject appointment requests
  const rejectAppointmentRequest = async (requestId) => {
    try {
      const allRequests = JSON.parse(localStorage.getItem('appointmentRequests') || '[]');
      const requestToReject = allRequests.find(req => req.id === requestId);
      
      if (!requestToReject) {
        setSnackbar({ open: true, message: "Request not found!", severity: "error" });
        return;
      }

      const updatedRequests = allRequests.map(req => 
        req.id === requestId ? { ...req, status: 'rejected', rejectedBy: currentUser?.name, rejectedAt: new Date().toISOString() } : req
      );
      localStorage.setItem('appointmentRequests', JSON.stringify(updatedRequests));
      setAppointmentRequests(updatedRequests);
      
      setSnackbar({ 
        open: true, 
        message: `❌ Appointment request from ${requestToReject.patientName} has been rejected.`, 
        severity: "info" 
      });
      
    } catch (error) {
      console.error("Error rejecting request:", error);
      setSnackbar({ open: true, message: "Failed to reject request: " + error.message, severity: "error" });
    }
  };

  // Delete Appointment Function
  const deleteAppointment = async (appointmentId) => {
    try {
      console.log("Deleting appointment with ID:", appointmentId);
      
      // Get all appointments
      const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      
      // Find the appointment to delete
      const appointmentToDelete = allAppointments.find(apt => apt.id === appointmentId);
      
      if (!appointmentToDelete) {
        setSnackbar({ open: true, message: "Appointment not found!", severity: "error" });
        return;
      }
      
      // Check if user has permission to delete
      if (userRole === 'doctor' && appointmentToDelete.doctorId !== currentUser?.regId) {
        setSnackbar({ open: true, message: "You can only delete your own appointments!", severity: "error" });
        return;
      }
      
      if (userRole === 'patient' && appointmentToDelete.patientId !== currentUser?.id) {
        setSnackbar({ open: true, message: "You can only delete your own appointments!", severity: "error" });
        return;
      }
      
      // Remove appointment from all appointments
      const updatedAppointments = allAppointments.filter(apt => apt.id !== appointmentId);
      localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
      
      // Refresh appointments display
      loadAppointments();
      
      setSnackbar({ 
        open: true, 
        message: "Appointment deleted successfully!", 
        severity: "success" 
      });
      
      // Close delete dialog
      setDeleteDialog({ open: false, appointmentId: null });
      
    } catch (error) {
      console.error("Delete appointment error:", error);
      setSnackbar({ 
        open: true, 
        message: "Failed to delete appointment: " + error.message, 
        severity: "error" 
      });
    }
  };

  // Delete Appointment Request Function
  const deleteAppointmentRequest = async (requestId) => {
    try {
      console.log("Deleting appointment request with ID:", requestId);
      
      // Get all appointment requests
      const allRequests = JSON.parse(localStorage.getItem('appointmentRequests') || '[]');
      
      // Find the request to delete
      const requestToDelete = allRequests.find(req => req.id === requestId);
      
      if (!requestToDelete) {
        setSnackbar({ open: true, message: "Request not found!", severity: "error" });
        return;
      }
      
      // Remove request from all requests
      const updatedRequests = allRequests.filter(req => req.id !== requestId);
      localStorage.setItem('appointmentRequests', JSON.stringify(updatedRequests));
      
      // Refresh requests display
      setAppointmentRequests(updatedRequests);
      
      setSnackbar({ 
        open: true, 
        message: "Request deleted successfully!", 
        severity: "success" 
      });
      
    } catch (error) {
      console.error("Delete request error:", error);
      setSnackbar({ 
        open: true, 
        message: "Failed to delete request: " + error.message, 
        severity: "error" 
      });
    }
  };

  // Load appointments for current user
  const loadAppointments = async () => {
    try {
      console.log("📋 Loading appointments from blockchain...");
      const contract = await getContract();
      
      let appointmentIds = [];
      
      if (userRole === 'doctor') {
        // Get appointments for doctor
        appointmentIds = await contract.getDoctorAppointments(currentUser?.regId);
        console.log(`👩‍⚕️ Found ${appointmentIds.length} appointments for doctor ${currentUser?.regId}`);
      } else if (userRole === 'patient') {
        // Get appointments for patient
        appointmentIds = await contract.getPatientAppointments(currentUser?.id);
        console.log(`🤒 Found ${appointmentIds.length} appointments for patient ${currentUser?.id}`);
      }

      // Fetch full appointment details for each ID
      const appointmentPromises = appointmentIds.map(async (id) => {
        const appointment = await contract.getAppointmentById(id);
        return {
          id: appointment.id.toString(),
          patientId: appointment.patientId,
          patientName: appointment.patientName,
          doctorId: appointment.doctorId,
          doctorName: appointment.doctorName,
          date: appointment.date,
          time: appointment.time,
          reason: appointment.reason,
          status: appointment.status,
          createdAt: new Date(appointment.createdAt * 1000).toISOString(), // Convert from timestamp
          fromRequest: appointment.fromRequest
        };
      });

      const blockchainAppointments = await Promise.all(appointmentPromises);
      console.log("✅ Loaded appointments from blockchain:", blockchainAppointments);
      
      setAppointments(blockchainAppointments);

      // Also sync with localStorage for backup/cache
      const localAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      
      // Merge blockchain and local appointments, prioritizing blockchain data
      const mergedAppointments = [...blockchainAppointments];
      localAppointments.forEach(localApt => {
        const exists = blockchainAppointments.find(bcApt => 
          bcApt.patientId === localApt.patientId && 
          bcApt.doctorId === localApt.doctorId && 
          bcApt.date === localApt.date && 
          bcApt.time === localApt.time
        );
        if (!exists) {
          mergedAppointments.push(localApt);
        }
      });

      setAppointments(mergedAppointments);
      
    } catch (error) {
      console.error("Error loading appointments from blockchain:", error);
      
      // Fallback to localStorage if blockchain fails
      console.log("📂 Falling back to localStorage...");
      if (userRole === 'doctor') {
        const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        const doctorAppointments = allAppointments.filter(apt => apt.doctorId === currentUser?.regId);
        setAppointments(doctorAppointments);
      } else if (userRole === 'patient') {
        const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        const patientAppointments = allAppointments.filter(apt => apt.patientId === currentUser?.id);
        setAppointments(patientAppointments);
      }
    }
  };

  // Registration forms
  const renderRegisterForm = () => {
    if (registerRole === "patient") {
      if (showSuccess && assignedPatientId) {
        return (
          <Paper
            sx={{
              bgcolor: "#232b39",
              color: "#fff",
              p: 4,
              borderRadius: 3,
              maxWidth: 400,
              width: "100%",
              boxShadow: "0 4px 24px #0002",
              textAlign: "center",
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color: "#00ff99",
                mb: 2,
                fontWeight: 700,
                textShadow: "0 0 8px #00ff99, 0 0 16px #00ff99",
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              SUCCESS
            </Typography>
            <Typography variant="body1" sx={{ color: "#fff", mb: 1 }}>
              Your Patient ID is:
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: "#00e6ff",
                fontWeight: 700,
                letterSpacing: 2,
                textShadow: "0 0 8px #00e6ff, 0 0 16px #00e6ff",
              }}
            >
              {assignedPatientId}
            </Typography>
            <Typography variant="body2" sx={{ color: "#fff", mt: 2 }}>
              Stored on blockchain! Please save this ID for login.
            </Typography>
          </Paper>
        );
      }
      return (
        <Paper
          sx={{
            bgcolor: "#232b39",
            color: "#fff",
            p: 4,
            borderRadius: 3,
            maxWidth: 400,
            width: "100%",
            boxShadow: "0 4px 24px #0002",
          }}
        >
          <Typography variant="h5" gutterBottom sx={{ color: "#fff" }}>
            Patient Registration (Blockchain)
          </Typography>
          <TextField label="Name" fullWidth margin="normal" value={patient.name} onChange={e => setPatient({ ...patient, name: e.target.value })} InputLabelProps={{ style: { color: "#fff" } }} InputProps={{ style: { color: "#fff", background: "#2d3748" } }} />
          <TextField label="Disease" fullWidth margin="normal" value={patient.disease} onChange={e => setPatient({ ...patient, disease: e.target.value })} InputLabelProps={{ style: { color: "#fff" } }} InputProps={{ style: { color: "#fff", background: "#2d3748" } }} />
          <TextField label="DOB" fullWidth margin="normal" value={patient.dob} onChange={e => setPatient({ ...patient, dob: e.target.value })} InputLabelProps={{ style: { color: "#fff" } }} InputProps={{ style: { color: "#fff", background: "#2d3748" } }} />
          <TextField label="Mobile" fullWidth margin="normal" value={patient.mobile} onChange={e => setPatient({ ...patient, mobile: e.target.value })} InputLabelProps={{ style: { color: "#fff" } }} InputProps={{ style: { color: "#fff", background: "#2d3748" } }} />
          <TextField label="Email" fullWidth margin="normal" value={patient.email} onChange={e => setPatient({ ...patient, email: e.target.value })} InputLabelProps={{ style: { color: "#fff" } }} InputProps={{ style: { color: "#fff", background: "#2d3748" } }} />
          <TextField label="SBP" fullWidth margin="normal" value={patient.sbp} onChange={e => setPatient({ ...patient, sbp: e.target.value })} InputLabelProps={{ style: { color: "#fff" } }} InputProps={{ style: { color: "#fff", background: "#2d3748" } }} />
          <TextField label="Blood Sugar Level" fullWidth margin="normal" value={patient.sugar} onChange={e => setPatient({ ...patient, sugar: e.target.value })} InputLabelProps={{ style: { color: "#fff" } }} InputProps={{ style: { color: "#fff", background: "#2d3748" } }} />
          <TextField label="Password" type="password" fullWidth margin="normal" value={patient.password} onChange={e => setPatient({ ...patient, password: e.target.value })} InputLabelProps={{ style: { color: "#fff" } }} InputProps={{ style: { color: "#fff", background: "#2d3748" } }} />
          
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            disabled={loading}
            onClick={async () => {
              if (loading) return;
              
              console.log("[Register Patient] Starting blockchain registration...");
              setLoading(true);
              
              try {
                // Validate inputs first
                if (!patient.name.trim()) {
                  throw new Error("Name is required");
                }
                if (!patient.disease.trim()) {
                  throw new Error("Disease/Condition is required");
                }
                if (!patient.password.trim()) {
                  throw new Error("Password is required");
                }
                
                console.log("[Register Patient] Inputs validated");
                
                // Check MetaMask
                if (!window.ethereum) {
                  throw new Error("MetaMask is not installed. Please install MetaMask to continue.");
                }

                // Request wallet connection
                console.log("[Register Patient] Requesting wallet connection...");
                await ensureWalletConnected(setSnackbar, setLoading);
                
                // Get provider and contract
                const provider = new BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const contract = new Contract(contractAddress, Healthcare.abi, signer);
                
                console.log("[Register Patient] Contract connected");
                
                // Show progress message
                setSnackbar({ 
                  open: true, 
                  message: "Submitting transaction to blockchain...", 
                  severity: "info" 
                });
                
                // Try different gas strategies
                let tx;
                const txData = [
                  patient.name.trim(),
                  patient.disease.trim(),
                  patient.dob.trim() || "Not specified",
                  patient.mobile.trim() || "Not specified", 
                  patient.email.trim() || "Not specified",
                  patient.sbp.trim() || "Not recorded",
                  patient.sugar.trim() || "Not recorded",
                  patient.password.trim()
                ];
                
                try {
                  // Strategy 1: Try with automatic gas settings
                  console.log("[Register Patient] Trying automatic gas...");
                  tx = await contract.registerPatient(...txData);
                  console.log("[Register Patient] Transaction sent with auto gas:", tx.hash);
                } catch (autoGasError) {
                  console.log("[Register Patient] Auto gas failed, trying manual gas...");
                  
                  try {
                    // Strategy 2: Try with manual gas settings
                    tx = await contract.registerPatient(...txData, {
                      gasLimit: 500000,
                      gasPrice: ethers.parseUnits('20', 'gwei')
                    });
                    console.log("[Register Patient] Transaction sent with manual gas:", tx.hash);
                  } catch (manualGasError) {
                    console.log("[Register Patient] Manual gas failed, trying higher gas...");
                    
                    // Strategy 3: Try with higher gas
                    tx = await contract.registerPatient(...txData, {
                      gasLimit: 1000000,
                      gasPrice: ethers.parseUnits('30', 'gwei')
                    });
                    console.log("[Register Patient] Transaction sent with high gas:", tx.hash);
                  }
                }
                
                // Update progress
                setSnackbar({ 
                  open: true, 
                  message: `Transaction submitted! Hash: ${tx.hash.substring(0, 10)}...`, 
                  severity: "info" 
                });
                
                // Wait for confirmation with extended timeout
                console.log("[Register Patient] Waiting for confirmation...");
                const confirmationTimeout = new Promise((_, reject) => 
                  setTimeout(() => reject(new Error("Transaction confirmation timeout")), 300000) // 5 minutes for local network
                );
                
                const receiptPromise = tx.wait();
                const receipt = await Promise.race([receiptPromise, confirmationTimeout]);
                
                console.log("[Register Patient] Transaction confirmed:", receipt);
                
                // Get patient ID from events or use fallback
                let patientId = null;
                
                if (receipt.logs && receipt.logs.length > 0) {
                  try {
                    for (const log of receipt.logs) {
                      try {
                        const parsed = contract.interface.parseLog(log);
                        if (parsed && parsed.name === 'PatientRegistered') {
                          patientId = parsed.args.patientId || parsed.args[0];
                          console.log("[Register Patient] Patient ID from event:", patientId);
                          break;
                        }
                      } catch (parseError) {
                        continue;
                      }
                    }
                  } catch (eventError) {
                    console.log("[Register Patient] Event parsing error:", eventError);
                  }
                }
                
                // If no event ID, try to get from contract
                if (!patientId) {
                  try {
                    const patientCount = await contract.patientCount();
                    patientId = `P${patientCount.toString().padStart(3, '0')}`;
                    console.log("[Register Patient] Generated ID from count:", patientId);
                  } catch (countError) {
                    // Final fallback
                    patientId = `P${Date.now().toString().slice(-6)}`;
                    console.log("[Register Patient] Generated ID from timestamp:", patientId);
                  }
                }
                
                // Update UI
                setAssignedPatientId(patientId);
                setShowSuccess(true);
                
                // Clear form
                setPatient({ 
                  name: "", 
                  disease: "", 
                  dob: "", 
                  mobile: "", 
                  email: "", 
                  sbp: "", 
                  sugar: "", 
                  password: "" 
                });
                
                setSnackbar({ 
                  open: true, 
                  message: `✅ Patient registered on blockchain! ID: ${patientId}`, 
                  severity: "success" 
                });

              } catch (err) {
                console.error("[Register Patient] Error:", err);
                
                let errorMessage = "Blockchain registration failed: ";
                
                if (err.code === 4001) {
                  errorMessage += "Transaction rejected by user. Please approve the transaction in MetaMask.";
                } else if (err.code === -32002) {
                  errorMessage += "MetaMask is already processing a request. Please check your wallet.";
                } else if (err.code === -32000) {
                  errorMessage += "Transaction failed. Please check your wallet balance and network connection.";
                } else if (err.message?.includes("insufficient funds")) {
                  errorMessage += "Insufficient funds for gas fees. Please add more ETH to your wallet.";
                } else if (err.message?.includes("execution reverted")) {
                  errorMessage += "Smart contract execution failed. Please check your inputs and try again.";
                } else if (err.message?.includes("network")) {
                  errorMessage += "Network error. Please check your Ganache connection and try again.";
                } else if (err.message?.includes("timeout")) {
                  errorMessage += "Transaction timed out. Please check your Ganache connection.";
                } else {
                  errorMessage += err.message || "Unknown error occurred. Please try again.";
                }
                
                setSnackbar({ 
                  open: true, 
                  message: errorMessage, 
                  severity: "error" 
                });
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? "Registering on Blockchain..." : "Register Patient"}
          </Button>
        </Paper>
      );
    }
    
    if (registerRole === "doctor") {
      if (showSuccess && assignedDoctorId) {
        return (
          <Paper
            sx={{
              bgcolor: "#232b39",
              color: "#fff",
              p: 4,
              borderRadius: 3,
              maxWidth: 400,
              width: "100%",
              boxShadow: "0 4px 24px #0002",
              textAlign: "center",
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color: "#00ff99",
                mb: 2,
                fontWeight: 700,
                textShadow: "0 0 8px #00ff99, 0 0 16px #00ff99",
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              SUCCESS
            </Typography>
            <Typography variant="body1" sx={{ color: "#fff", mb: 1 }}>
              Your Doctor Reg ID is:
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: "#00e6ff",
                fontWeight: 700,
                letterSpacing: 2,
                textShadow: "0 0 8px #00e6ff, 0 0 16px #00e6ff",
              }}
            >
              {assignedDoctorId}
            </Typography>
            <Typography variant="body2" sx={{ color: "#fff", mt: 2 }}>
              Stored on blockchain!
            </Typography>
          </Paper>
        );
      }
      return (
        <Paper
          sx={{
            bgcolor: "#232b39",
            color: "#fff",
            p: 4,
            borderRadius: 3,
            maxWidth: 400,
            width: "100%",
            boxShadow: "0 4px 24px #0002",
          }}
        >
          <Typography variant="h5" gutterBottom sx={{ color: "#fff" }}>
            Doctor Registration (Blockchain)
          </Typography>
          <TextField label="Name" fullWidth margin="normal" value={doctor.name} onChange={e => setDoctor({ ...doctor, name: e.target.value })} InputLabelProps={{ style: { color: "#fff" } }} InputProps={{ style: { color: "#fff", background: "#2d3748" } }} />
          <TextField 
            label="Reg ID (Optional - Auto-generated if empty)" 
            fullWidth 
            margin="normal" 
            value={doctor.regId} 
            onChange={e => setDoctor({ ...doctor, regId: e.target.value })} 
            InputLabelProps={{ style: { color: "#fff" } }} 
            InputProps={{ style: { color: "#fff", background: "#2d3748" } }}
            placeholder="Leave empty for auto-generation (D001, D002, etc.)"
          />
          <TextField label="Phone" fullWidth margin="normal" value={doctor.phone} onChange={e => setDoctor({ ...doctor, phone: e.target.value })} InputLabelProps={{ style: { color: "#fff" } }} InputProps={{ style: { color: "#fff", background: "#2d3748" } }} />
          <TextField label="Password" type="password" fullWidth margin="normal" value={doctor.password} onChange={e => setDoctor({ ...doctor, password: e.target.value })} InputLabelProps={{ style: { color: "#fff" } }} InputProps={{ style: { color: "#fff", background: "#2d3748" } }} />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            disabled={loading}
            onClick={async () => {
              console.log("[Register Doctor] Starting blockchain registration...");
              setLoading(true);
              
              try {
                // Validate inputs
                if (!doctor.name.trim()) {
                  throw new Error("Name is required");
                }
                if (!doctor.password.trim()) {
                  throw new Error("Password is required");
                }

                await ensureWalletConnected(setSnackbar, setLoading);
                
                const provider = new BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const contract = new Contract(contractAddress, Healthcare.abi, signer);
                
                console.log("[Register Doctor] Contract connected");
                
                // Auto-generate doctor ID using doctorCount
                let doctorId = doctor.regId.trim();
                if (!doctorId) {
                  try {
                    const doctorCount = await contract.doctorCount();
                    const nextDoctorNumber = doctorCount + 1n; // Add 1 for next doctor
                    doctorId = `D${nextDoctorNumber.toString().padStart(3, '0')}`;
                    console.log("[Register Doctor] Auto-generated ID:", doctorId);
                  } catch (countError) {
                    // Fallback to timestamp-based ID
                    doctorId = `D${Date.now().toString().slice(-3)}`;
                    console.log("[Register Doctor] Generated ID from timestamp:", doctorId);
                  }
                }
                
                setSnackbar({ 
                  open: true, 
                  message: "Submitting doctor registration to blockchain...", 
                  severity: "info" 
                });
                
                const txData = [
                  doctor.name.trim(),
                  doctorId,
                  doctor.phone.trim() || "Not specified",
                  doctor.password.trim()
                ];
                
                let tx;
                try {
                  tx = await contract.registerDoctor(...txData);
                } catch (autoGasError) {
                  tx = await contract.registerDoctor(...txData, {
                    gasLimit: 500000,
                    gasPrice: ethers.parseUnits('20', 'gwei')
                  });
                }
                
                console.log("[Register Doctor] Transaction sent:", tx.hash);
                
                setSnackbar({ 
                  open: true, 
                  message: `Transaction submitted! Hash: ${tx.hash.substring(0, 10)}...`, 
                  severity: "info" 
                });
                
                const confirmationTimeout = new Promise((_, reject) => 
                  setTimeout(() => reject(new Error("Transaction confirmation timeout")), 300000)
                );
                
                const receipt = await Promise.race([tx.wait(), confirmationTimeout]);
                console.log("[Register Doctor] Transaction confirmed:", receipt);
                
                setAssignedDoctorId(doctorId);
                setShowSuccess(true);
                setDoctor({ name: "", regId: "", phone: "", password: "" });
                
                // Reload doctors list to update dropdown
                loadRegisteredDoctors();
                
                setSnackbar({ 
                  open: true, 
                  message: `✅ Doctor registered on blockchain! ID: ${doctorId}`, 
                  severity: "success" 
                });
                
              } catch (err) {
                console.error("[Register Doctor] Error:", err);
                
                let errorMessage = "Blockchain registration failed: ";
                if (err.code === 4001) {
                  errorMessage += "Transaction rejected by user";
                } else if (err.message?.includes("insufficient funds")) {
                  errorMessage += "Insufficient funds for gas fees";
                } else if (err.message?.includes("execution reverted")) {
                  errorMessage += "Smart contract execution failed";
                } else if (err.message?.includes("timeout")) {
                  errorMessage += "Transaction timed out. Please check your Ganache connection.";
                } else {
                  errorMessage += err.message;
                }
                
                setSnackbar({ open: true, message: errorMessage, severity: "error" });
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? "Registering on Blockchain..." : "Register Doctor"}
          </Button>
        </Paper>
      );
    }
    
    // Role selection
    return (
      <Paper
        sx={{
          bgcolor: "#232b39",
          color: "#fff",
          p: 4,
          borderRadius: 3,
          maxWidth: 400,
          width: "100%",
          boxShadow: "0 4px 24px #0002",
          textAlign: "center",
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ color: "#fff" }}>
          Register as:
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          fullWidth
          sx={{ mb: 2 }}
          onClick={() => setRegisterRole("patient")}
        >
          Patient
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          fullWidth
          onClick={() => setRegisterRole("doctor")}
        >
          Doctor
        </Button>
      </Paper>
    );
  };
  // ...existing code...

  // Login forms - Blockchain Only
  const renderLoginForm = () => {
    if (loginRole === "patient") {
      if (patientDashboard) {
        return (
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ color: "#fff", textAlign: "center" }}>
              Patient Dashboard - Welcome {patientDashboard.name}
            </Typography>
            
            <Paper sx={{ bgcolor: "#232b39", color: "#fff", p: 4, borderRadius: 3, mb: 3 }}>
  <Typography variant="h6" gutterBottom sx={{ color: "#4fc3f7", fontWeight: "bold" }}>
    📋 Your Health Information (From Blockchain)
  </Typography>
  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 2 }}>
    <Typography><strong>Patient ID:</strong> {patientDashboard.id}</Typography>
    <Typography><strong>Name:</strong> {patientDashboard.name}</Typography>
    <Typography><strong>Disease:</strong> {patientDashboard.disease}</Typography>
    <Typography><strong>Date of Birth:</strong> {patientDashboard.dob}</Typography>
    <Typography><strong>Mobile:</strong> {patientDashboard.mobile}</Typography>
    <Typography><strong>Email:</strong> {patientDashboard.email}</Typography>
    <Typography><strong>Blood Pressure (SBP):</strong> {patientDashboard.sbp}</Typography>
    <Typography><strong>Blood Sugar Level:</strong> {patientDashboard.sugar}</Typography>
  </Box>
</Paper>
<RiskAssessment patientData={patientDashboard} />

            <AIChat patientData={patientDashboard} />
            
            <Paper sx={{ bgcolor: "#232b39", color: "#fff", p: 4, borderRadius: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: "#4fc3f7", fontWeight: "bold" }}>
                📅 Your Appointments
              </Typography>
              <Button 
                variant="outlined" 
                onClick={loadAppointments}
                sx={{ mb: 3, mr: 2, color: "#fff", borderColor: "#fff" }}
              >
                🔄 Refresh Appointments
              </Button>
              <Button 
                variant="contained" 
                onClick={() => setShowPatientRequestForm(true)}
                sx={{ mb: 3, backgroundColor: "#4fc3f7", "&:hover": { backgroundColor: "#29b6f6" } }}
              >
                📅 Request New Appointment
              </Button>
              {appointments.length > 0 ? (
                appointments.map((appointment) => (
                  <Box key={appointment.id} sx={{ mb: 2, p: 3, bgcolor: "#2d3748", borderRadius: 2, position: "relative" }}>
                    <Typography><strong>Doctor:</strong> {appointment.doctorName}</Typography>
                    <Typography><strong>Date:</strong> {appointment.date}</Typography>
                    <Typography><strong>Time:</strong> {appointment.time}</Typography>
                    <Typography><strong>Reason:</strong> {appointment.reason}</Typography>
                    <Typography><strong>Status:</strong> {appointment.status}</Typography>
                    
                    {/* Delete Button for Patient */}
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => setDeleteDialog({ open: true, appointmentId: appointment.id })}
                      sx={{ 
                        position: "absolute",
                        top: 10,
                        right: 10,
                        minWidth: "auto",
                        px: 2,
                        color: "#ff6b6b",
                        borderColor: "#ff6b6b",
                        "&:hover": {
                          backgroundColor: "#ff6b6b",
                          color: "#fff"
                        }
                      }}
                    >
                      🗑️ Delete
                    </Button>
                  </Box>
                ))
              ) : (
                <Typography sx={{ color: "#888" }}>No appointments scheduled</Typography>
              )}
            </Paper>
            
            {/* Patient Appointment Request Form */}
            {showPatientRequestForm && (
              <Paper sx={{ bgcolor: "#232b39", color: "#fff", p: 4, borderRadius: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: "#4fc3f7", fontWeight: "bold" }}>
                  📅 Request New Appointment
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 2, mb: 3 }}>
                  <TextField
                    label="Preferred Date"
                    type="date"
                    value={patientRequestForm.date}
                    onChange={e => setPatientRequestForm({ ...patientRequestForm, date: e.target.value })}
                    InputLabelProps={{ style: { color: "#fff" }, shrink: true }}
                    InputProps={{ style: { color: "#fff", background: "#2d3748" } }}
                    required
                  />
                  <TextField
                    label="Preferred Time"
                    type="time"
                    value={patientRequestForm.time}
                    onChange={e => setPatientRequestForm({ ...patientRequestForm, time: e.target.value })}
                    InputLabelProps={{ style: { color: "#fff" }, shrink: true }}
                    InputProps={{ style: { color: "#fff", background: "#2d3748" } }}
                    required
                  />
                  <TextField
                    label="Reason for Visit"
                    value={patientRequestForm.reason}
                    onChange={e => setPatientRequestForm({ ...patientRequestForm, reason: e.target.value })}
                    InputLabelProps={{ style: { color: "#fff" } }}
                    InputProps={{ style: { color: "#fff", background: "#2d3748" } }}
                    placeholder="e.g., General checkup, Follow-up, etc."
                  />
                  <FormControl fullWidth margin="normal">
                    <InputLabel sx={{ color: "#fff" }}>Preferred Doctor</InputLabel>
                    <Select
                      value={patientRequestForm.preferredDoctor}
                      onChange={e => setPatientRequestForm({ ...patientRequestForm, preferredDoctor: e.target.value })}
                      sx={{ 
                        color: "#fff", 
                        backgroundColor: "#2d3748",
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#555'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#777'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#4fc3f7'
                        },
                        '& .MuiSvgIcon-root': {
                          color: '#fff'
                        }
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            bgcolor: '#2d3748',
                            '& .MuiMenuItem-root': {
                              color: '#fff',
                              '&:hover': {
                                bgcolor: '#4a5568'
                              },
                              '&.Mui-selected': {
                                bgcolor: '#4fc3f7',
                                '&:hover': {
                                  bgcolor: '#29b6f6'
                                }
                              }
                            }
                          }
                        }
                      }}
                    >
                      <MenuItem value="">
                        <em>Any available doctor</em>
                      </MenuItem>
                      {registeredDoctors.map((doctor) => (
                        <MenuItem key={doctor.id} value={`${doctor.name} (${doctor.id})`}>
                          {doctor.name} ({doctor.id})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Button 
                    variant="contained" 
                    onClick={submitAppointmentRequest}
                    disabled={loading}
                    sx={{ backgroundColor: "#4fc3f7", "&:hover": { backgroundColor: "#29b6f6" } }}
                  >
                    {loading ? "Submitting..." : "Submit Request"}
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={() => setShowPatientRequestForm(false)}
                    sx={{ color: "#fff", borderColor: "#fff" }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Paper>
            )}
            
            {/* Patient's Appointment Requests Status */}
            <Paper sx={{ bgcolor: "#232b39", color: "#fff", p: 4, borderRadius: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: "#4fc3f7", fontWeight: "bold" }}>
                📋 Your Appointment Requests
              </Typography>
              {appointmentRequests.filter(req => req.patientId === patientDashboard.id).length > 0 ? (
                appointmentRequests
                  .filter(req => req.patientId === patientDashboard.id)
                  .map((request) => (
                    <Box key={request.id} sx={{ mb: 2, p: 3, bgcolor: "#2d3748", borderRadius: 2 }}>
                      <Typography><strong>Date:</strong> {request.date}</Typography>
                      <Typography><strong>Time:</strong> {request.time}</Typography>
                      <Typography><strong>Reason:</strong> {request.reason}</Typography>
                      <Typography><strong>Preferred Doctor:</strong> {request.preferredDoctor || "Any available"}</Typography>
                      <Typography>
                        <strong>Status:</strong> 
                        <Chip 
                          label={request.status.toUpperCase()}
                          color={request.status === 'pending' ? 'warning' : request.status === 'approved' ? 'success' : 'error'} 
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                      <Typography><strong>Requested:</strong> {new Date(request.requestedAt).toLocaleString()}</Typography>
                      {request.status === 'approved' && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: "#1b5e20", borderRadius: 1 }}>
                          <Typography sx={{ color: "#4fc3f7" }}>
                            <strong>✅ Approved by:</strong> Dr. {request.approvedBy}
                          </Typography>
                          <Typography sx={{ color: "#81c784", fontSize: "0.9em" }}>
                            📧 Email confirmation sent to your registered email address
                          </Typography>
                          <Typography sx={{ color: "#81c784", fontSize: "0.9em" }}>
                            📅 Check your appointments above for the scheduled details
                          </Typography>
                        </Box>
                      )}
                      {request.status === 'rejected' && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: "#b71c1c", borderRadius: 1 }}>
                          <Typography sx={{ color: "#ffcdd2" }}>
                            <strong>❌ Rejected by:</strong> Dr. {request.rejectedBy}
                          </Typography>
                          <Typography sx={{ color: "#ffcdd2", fontSize: "0.9em" }}>
                            Please try submitting a new request with different date/time
                          </Typography>
                        </Box>
                      )}
                      {request.status === 'pending' && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: "#e65100", borderRadius: 1 }}>
                          <Typography sx={{ color: "#ffcc02", fontSize: "0.9em" }}>
                            ⏳ Waiting for doctor review. You'll receive an email when approved.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  ))
              ) : (
                <Typography sx={{ color: "#888" }}>No appointment requests submitted</Typography>
              )}
            </Paper>
            
            {/* Secure Chat Section */}
            <Paper sx={{ bgcolor: "#232b39", color: "#fff", p: 4, borderRadius: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: "#4fc3f7", fontWeight: "bold" }}>
                💬 Secure Chat with Your Doctors
              </Typography>
              <SecureChat 
                currentUser={patientDashboard}
                userRole="patient"
                appointments={appointments}
                onNotification={handleChatNotification}
              />
            </Paper>
            
            <Box sx={{ textAlign: "center", mt: 3 }}>
              <Button
                variant="outlined"
                onClick={handleLogout}
                sx={{ 
                  color: "#fff", 
                  borderColor: "#fff",
                  px: 4,
                  py: 1,
                  mr: 2,
                  "&:hover": {
                    borderColor: "#ff6b6b",
                    color: "#ff6b6b"
                  }
                }}
              >
                🚪 Logout
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleNav("home")}
                sx={{ 
                  color: "#fff", 
                  borderColor: "#fff",
                  px: 4,
                  py: 1,
                  "&:hover": {
                    borderColor: "#4fc3f7",
                    color: "#4fc3f7"
                  }
                }}
              >
                🏠 Back to Home
              </Button>
            </Box>
          </Container>
        );
      }
      return (
        <Paper
          sx={{
            bgcolor: "#232b39",
            color: "#fff",
            p: 4,
            borderRadius: 3,
            maxWidth: 400,
            width: "100%",
            boxShadow: "0 4px 24px #0002",
          }}
        >
          <Typography variant="h5" gutterBottom sx={{ color: "#fff" }}>
            Patient Login (Blockchain)
          </Typography>
          <TextField label="Patient ID" fullWidth margin="normal" value={loginPatient.id} onChange={e => setLoginPatient({ ...loginPatient, id: e.target.value })} InputLabelProps={{ style: { color: "#fff" } }} InputProps={{ style: { color: "#fff", background: "#2d3748" } }} />
          <TextField label="Password" type="password" fullWidth margin="normal" value={loginPatient.password} onChange={e => setLoginPatient({ ...loginPatient, password: e.target.value })} InputLabelProps={{ style: { color: "#fff" } }} InputProps={{ style: { color: "#fff", background: "#2d3748" } }} />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            disabled={loading}
            onClick={async () => {
              if (!loginPatient.id.trim() || !loginPatient.password.trim()) {
                setSnackbar({ open: true, message: "Please enter both Patient ID and Password", severity: "error" });
                return;
              }

              setLoading(true);
              try {
                console.log("[Patient Login] Authenticating with blockchain...");
                
                const contract = await getContract();
                
                // Add timeout to blockchain login
                const timeout = new Promise((_, reject) => 
                  setTimeout(() => reject(new Error("Login timeout")), 60000) // 60 seconds for blockchain
                );
                
                setSnackbar({ 
                  open: true, 
                  message: "Authenticating with blockchain...", 
                  severity: "info" 
                });
                
                const loginPromise = contract.loginPatient(loginPatient.id, loginPatient.password);
                const isValid = await Promise.race([loginPromise, timeout]);
                
                if (isValid) {
                  console.log("[Patient Login] Authentication successful, fetching data...");
                  
                  const infoPromise = contract.getPatientById(loginPatient.id);
                  const info = await Promise.race([infoPromise, timeout]);
                  
                  const dashboardData = {
                    id: info[0],
                    name: info[1],
                    disease: info[2],
                    dob: info[3],
                    mobile: info[4],
                    email: info[5],
                    sbp: info[6],
                    sugar: info[7],
                  };
                  
                  setPatientDashboard(dashboardData);
                  setCurrentUser(dashboardData);
                  setUserRole('patient');
                  
                  setSnackbar({ open: true, message: "Patient login successful from blockchain!", severity: "success" });
                  setLoginPatient({ id: "", password: "" });
                } else {
                  setSnackbar({ open: true, message: "Invalid Patient ID or Password", severity: "error" });
                }
                
              } catch (err) {
                console.error("[Patient Login] Error:", err);
                
                let errorMessage = "Login failed: ";
                if (err.message?.includes("timeout")) {
                  errorMessage += "Blockchain connection timed out. Please check your network.";
                } else if (err.message?.includes("execution reverted")) {
                  errorMessage += "Invalid credentials or patient not found.";
                } else {
                  errorMessage += err.message || "Unknown error occurred.";
                }
                
                setSnackbar({ open: true, message: errorMessage, severity: "error" });
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? "Authenticating..." : "Login as Patient"}
          </Button>
        </Paper>
      );
    }
    
    if (loginRole === "doctor") {
      if (doctorDashboard) {
        return (
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ color: "#fff", textAlign: "center" }}>
              Doctor Dashboard - Welcome Dr. {doctorDashboard.name}
            </Typography>
            
            <Paper sx={{ bgcolor: "#232b39", color: "#fff", p: 4, borderRadius: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: "#4fc3f7", fontWeight: "bold" }}>
                👨‍⚕️ Your Information (From Blockchain)
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 2 }}>
                <Typography><strong>Name:</strong> {doctorDashboard.name}</Typography>
                <Typography><strong>Registration ID:</strong> {doctorDashboard.regId}</Typography>
                <Typography><strong>Phone:</strong> {doctorDashboard.phone}</Typography>
              </Box>
            </Paper>

            <Paper sx={{ bgcolor: "#232b39", color: "#fff", p: 4, borderRadius: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: "#4fc3f7", fontWeight: "bold" }}>
                🔍 Search Patient (Blockchain)
              </Typography>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 3 }}>
                <TextField
                  label="Patient ID (e.g., P001)"
                  value={searchPatientId}
                  onChange={e => setSearchPatientId(e.target.value)}
                  sx={{ flexGrow: 1 }}
                  InputLabelProps={{ style: { color: "#fff" } }}
                  InputProps={{ style: { color: "#fff", background: "#2d3748" } }}
                />
                <Button
                  variant="contained"
                  onClick={searchPatientById}
                  disabled={loading}
                  sx={{ px: 4 }}
                >
                  {loading ? "Searching..." : "Search"}
                </Button>
              </Box>

              {searchedPatient && (
                <Box sx={{ mt: 3, p: 3, bgcolor: "#2d3748", borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ color: "#00ff99", mb: 2 }}>
                    Patient Found: {searchedPatient.name}
                  </Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 2 }}>
                    <Typography><strong>ID:</strong> {searchedPatient.id}</Typography>
                    <Typography><strong>Disease:</strong> {searchedPatient.disease}</Typography>
                    <Typography><strong>DOB:</strong> {searchedPatient.dob}</Typography>
                    <Typography><strong>Mobile:</strong> {searchedPatient.mobile}</Typography>
                    <Typography><strong>Email:</strong> {searchedPatient.email}</Typography>
                    <Typography><strong>Blood Pressure:</strong> {searchedPatient.sbp}</Typography>
                    <Typography><strong>Blood Sugar:</strong> {searchedPatient.sugar}</Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setAppointmentForm({ ...appointmentForm, patientId: searchedPatient.id });
                      setShowAppointmentForm(true);
                    }}
                    sx={{ mt: 2, color: "#00e6ff", borderColor: "#00e6ff" }}
                  >
                    📅 Book Appointment
                  </Button>
                </Box>
              )}
            </Paper>

            {showAppointmentForm && (
              <Paper sx={{ bgcolor: "#232b39", color: "#fff", p: 4, borderRadius: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: "#4fc3f7", fontWeight: "bold" }}>
                  📅 Book Appointment
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 2 }}>
                  <TextField
                    label="Patient ID"
                    value={appointmentForm.patientId}
                    onChange={e => setAppointmentForm({ ...appointmentForm, patientId: e.target.value })}
                    InputLabelProps={{ style: { color: "#fff" } }}
                    InputProps={{ style: { color: "#fff", background: "#2d3748" } }}
                  />
                  <TextField
                    label="Date"
                    type="date"
                    value={appointmentForm.date}
                    onChange={e => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
                    InputLabelProps={{ style: { color: "#fff" }, shrink: true }}
                    InputProps={{ style: { color: "#fff", background: "#2d3748" } }}
                  />
                  <TextField
                    label="Time"
                    type="time"
                    value={appointmentForm.time}
                    onChange={e => setAppointmentForm({ ...appointmentForm, time: e.target.value })}
                    InputLabelProps={{ style: { color: "#fff" }, shrink: true }}
                    InputProps={{ style: { color: "#fff", background: "#2d3748" } }}
                  />
                  <TextField
                    label="Reason"
                    value={appointmentForm.reason}
                    onChange={e => setAppointmentForm({ ...appointmentForm, reason: e.target.value })}
                    InputLabelProps={{ style: { color: "#fff" } }}
                    InputProps={{ style: { color: "#fff", background: "#2d3748" } }}
                  />
                </Box>
                <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
                  <Button 
                    variant="contained" 
                    onClick={bookAppointment}
                    disabled={loading}
                  >
                    {loading ? "Booking..." : "Book Appointment"}
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={() => setShowAppointmentForm(false)}
                    sx={{ color: "#fff", borderColor: "#fff" }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Paper>
            )}

            <Paper sx={{ bgcolor: "#232b39", color: "#fff", p: 4, borderRadius: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: "#4fc3f7", fontWeight: "bold" }}>
                📋 Your Appointments
              </Typography>
              <Button 
                variant="outlined" 
                onClick={loadAppointments}
                sx={{ mb: 3, color: "#fff", borderColor: "#fff" }}
              >
                🔄 Refresh Appointments
              </Button>
              {appointments.length > 0 ? (
                appointments.map((appointment) => (
                  <Box key={appointment.id} sx={{ mb: 2, p: 3, bgcolor: "#2d3748", borderRadius: 2, position: "relative" }}>
                    <Typography><strong>Patient ID:</strong> {appointment.patientId}</Typography>
                    <Typography><strong>Date:</strong> {appointment.date}</Typography>
                    <Typography><strong>Time:</strong> {appointment.time}</Typography>
                    <Typography><strong>Reason:</strong> {appointment.reason}</Typography>
                    <Typography><strong>Status:</strong> {appointment.status}</Typography>
                    
                    {/* Delete Button for Doctor */}
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => setDeleteDialog({ open: true, appointmentId: appointment.id })}
                      sx={{ 
                        position: "absolute",
                        top: 10,
                        right: 10,
                        minWidth: "auto",
                        px: 2,
                        color: "#ff6b6b",
                        borderColor: "#ff6b6b",
                        "&:hover": {
                          backgroundColor: "#ff6b6b",
                          color: "#fff"
                        }
                      }}
                    >
                      🗑️ Delete
                    </Button>
                  </Box>
                ))
              ) : (
                <Typography sx={{ color: "#888" }}>No appointments scheduled</Typography>
              )}
            </Paper>

            {/* Doctor's Appointment Requests Management */}
            <Paper sx={{ bgcolor: "#232b39", color: "#fff", p: 4, borderRadius: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: "#4fc3f7", fontWeight: "bold" }}>
                📥 Patient Appointment Requests
              </Typography>
              <Button 
                variant="outlined" 
                onClick={loadAppointmentRequests}
                sx={{ mb: 3, color: "#fff", borderColor: "#fff" }}
              >
                🔄 Refresh Requests
              </Button>
              {appointmentRequests
                .filter(req => req.status === 'pending')
                .filter(req => {
                  // Show requests that are either:
                  // 1. For any available doctor (no specific doctor selected)
                  // 2. Specifically for the current doctor
                  return !req.preferredDoctorId || 
                         req.preferredDoctorId === currentUser?.regId ||
                         req.preferredDoctor === "" ||
                         req.preferredDoctor === "Any available doctor";
                })
                .length > 0 ? (
                appointmentRequests
                  .filter(req => req.status === 'pending')
                  .filter(req => {
                    // Same filtering logic as above
                    return !req.preferredDoctorId || 
                           req.preferredDoctorId === currentUser?.regId ||
                           req.preferredDoctor === "" ||
                           req.preferredDoctor === "Any available doctor";
                  })
                  .map((request) => (
                    <Box key={request.id} sx={{ mb: 3, p: 3, bgcolor: "#2d3748", borderRadius: 2, border: "1px solid #4fc3f7" }}>
                      <Typography variant="h6" sx={{ color: "#4fc3f7", mb: 2 }}>
                        🩺 New Request from {request.patientName}
                      </Typography>
                      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2, mb: 2 }}>
                        <Typography><strong>Patient ID:</strong> {request.patientId}</Typography>
                        <Typography><strong>Patient Name:</strong> {request.patientName}</Typography>
                        <Typography><strong>Mobile:</strong> {request.patientMobile}</Typography>
                        <Typography><strong>Email:</strong> {request.patientEmail}</Typography>
                        <Typography><strong>Preferred Date:</strong> {request.date}</Typography>
                        <Typography><strong>Preferred Time:</strong> {request.time}</Typography>
                        <Typography><strong>Reason:</strong> {request.reason}</Typography>
                        <Typography><strong>Preferred Doctor:</strong> {request.preferredDoctor || "Any available"}</Typography>
                      </Box>
                      <Typography sx={{ color: "#888", fontSize: "0.9em", mb: 2 }}>
                        <strong>Requested:</strong> {new Date(request.requestedAt).toLocaleString()}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 2 }}>
                        <Button
                          variant="contained"
                          onClick={() => approveAppointmentRequest(request.id)}
                          disabled={loading}
                          sx={{ 
                            backgroundColor: "#4caf50", 
                            "&:hover": { backgroundColor: "#45a049" },
                            color: "#fff"
                          }}
                        >
                          {loading ? "Approving..." : "✅ Approve & Schedule"}
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => rejectAppointmentRequest(request.id)}
                          sx={{ 
                            color: "#ff6b6b", 
                            borderColor: "#ff6b6b",
                            "&:hover": {
                              backgroundColor: "#ff6b6b",
                              color: "#fff"
                            }
                          }}
                        >
                          ❌ Reject
                        </Button>
                      </Box>
                    </Box>
                  ))
              ) : (
                <Typography sx={{ color: "#888" }}>No pending appointment requests for you</Typography>
              )}
              
              {/* Show processed requests */}
              {appointmentRequests.filter(req => req.status !== 'pending').length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: "#888", fontWeight: "bold" }}>
                      📋 Recently Processed Requests
                    </Typography>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => {
                        const pendingRequests = appointmentRequests.filter(req => req.status === 'pending');
                        localStorage.setItem('appointmentRequests', JSON.stringify(pendingRequests));
                        setAppointmentRequests(pendingRequests);
                        setSnackbar({ 
                          open: true, 
                          message: "All processed requests cleared!", 
                          severity: "success" 
                        });
                      }}
                      sx={{ 
                        color: "#ff6b6b",
                        borderColor: "#ff6b6b",
                        "&:hover": {
                          backgroundColor: "#ff6b6b",
                          color: "#fff"
                        }
                      }}
                    >
                      🗑️ Clear All
                    </Button>
                  </Box>
                  {appointmentRequests
                    .filter(req => req.status !== 'pending')
                    .slice(0, 5) // Show only last 5 processed requests
                    .map((request) => (
                      <Box key={request.id} sx={{ mb: 2, p: 2, bgcolor: "#1a1a1a", borderRadius: 2, opacity: 0.7, position: "relative" }}>
                        <Typography><strong>{request.patientName}</strong> - {request.date} at {request.time}</Typography>
                        <Typography>
                          <strong>Status:</strong> 
                          <Chip 
                            label={request.status.toUpperCase()}
                            color={request.status === 'approved' ? 'success' : 'error'} 
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </Typography>
                        
                        {/* Delete Button for Processed Requests */}
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => deleteAppointmentRequest(request.id)}
                          sx={{ 
                            position: "absolute",
                            top: 8,
                            right: 8,
                            minWidth: "auto",
                            px: 1.5,
                            py: 0.5,
                            color: "#ff6b6b",
                            borderColor: "#ff6b6b",
                            opacity: 0.8,
                            "&:hover": {
                              backgroundColor: "#ff6b6b",
                              color: "#fff",
                              opacity: 1
                            }
                          }}
                        >
                          🗑️
                        </Button>
                      </Box>
                    ))}
                </Box>
              )}
            </Paper>

            {/* Secure Chat Section for Doctors */}
            <Paper sx={{ bgcolor: "#232b39", color: "#fff", p: 4, borderRadius: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: "#4fc3f7", fontWeight: "bold" }}>
                💬 Secure Chat with Your Patients
              </Typography>
              <SecureChat 
                currentUser={doctorDashboard}
                userRole="doctor"
                appointments={appointments}
                onNotification={handleChatNotification}
              />
            </Paper>

            <Box sx={{ textAlign: "center", mt: 3 }}>
              <Button
                variant="outlined"
                onClick={handleLogout}
                sx={{ 
                  color: "#fff", 
                  borderColor: "#fff",
                  px: 4,
                  py: 1,
                  mr: 2,
                  "&:hover": {
                    borderColor: "#ff6b6b",
                    color: "#ff6b6b"
                  }
                }}
              >
                🚪 Logout
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleNav("home")}
                sx={{ 
                  color: "#fff", 
                  borderColor: "#fff",
                  px: 4,
                  py: 1,
                  "&:hover": {
                    borderColor: "#4fc3f7",
                    color: "#4fc3f7"
                  }
                }}
              >
                🏠 Back to Home
              </Button>
            </Box>
          </Container>
        );
      }
      return (
        <Paper
          sx={{
            bgcolor: "#232b39",
            color: "#fff",
            p: 4,
            borderRadius: 3,
            maxWidth: 400,
            width: "100%",
            boxShadow: "0 4px 24px #0002",
          }}
        >
          <Typography variant="h5" gutterBottom sx={{ color: "#fff" }}>
            Doctor Login (Blockchain)
          </Typography>
          <TextField label="Reg ID" fullWidth margin="normal" value={loginDoctor.doctorId} onChange={e => setLoginDoctor({ ...loginDoctor, doctorId: e.target.value })} InputLabelProps={{ style: { color: "#fff" } }} InputProps={{ style: { color: "#fff", background: "#2d3748" } }} />
          <TextField label="Password" type="password" fullWidth margin="normal" value={loginDoctor.password} onChange={e => setLoginDoctor({ ...loginDoctor, password: e.target.value })} InputLabelProps={{ style: { color: "#fff" } }} InputProps={{ style: { color: "#fff", background: "#2d3748" } }} />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            disabled={loading}
            onClick={async () => {
              if (!loginDoctor.doctorId.trim() || !loginDoctor.password.trim()) {
                setSnackbar({ open: true, message: "Please enter both Doctor ID and Password", severity: "error" });
                return;
              }

              setLoading(true);
              try {
                console.log("[Doctor Login] Authenticating with blockchain...");
                
                const contract = await getContract();
                
                const timeout = new Promise((_, reject) => 
                  setTimeout(() => reject(new Error("Login timeout")), 60000)
                );
                
                setSnackbar({ 
                  open: true, 
                  message: "Authenticating with blockchain...", 
                  severity: "info" 
                });
                
                const loginPromise = contract.loginDoctor(loginDoctor.doctorId, loginDoctor.password);
                const isValid = await Promise.race([loginPromise, timeout]);
                
                if (isValid) {
                  console.log("[Doctor Login] Authentication successful, fetching data...");
                  
                  const infoPromise = contract.getDoctorByRegId(loginDoctor.doctorId);
                  const info = await Promise.race([infoPromise, timeout]);
                  
                  const dashboardData = {
                    name: info[0],
                    regId: info[1],
                    phone: info[2],
                  };
                  
                  setDoctorDashboard(dashboardData);
                  setCurrentUser(dashboardData);
                  setUserRole('doctor');
                  
                  setSnackbar({ open: true, message: "Doctor login successful from blockchain!", severity: "success" });
                  setLoginDoctor({ doctorId: "", password: "" });
                } else {
                  setSnackbar({ open: true, message: "Invalid credentials.", severity: "error" });
                }
              } catch (err) {
                console.error("[Doctor Login] Error:", err);
                
                let errorMessage = "Login failed: ";
                if (err.message?.includes("timeout")) {
                  errorMessage += "Blockchain connection timed out. Please check your network.";
                } else if (err.message?.includes("execution reverted")) {
                  errorMessage += "Invalid credentials or doctor not found.";
                } else {
                  errorMessage += err.message || "Unknown error occurred.";
                }
                
                setSnackbar({ open: true, message: errorMessage, severity: "error" });
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? "Authenticating..." : "Login as Doctor"}
          </Button>
        </Paper>
      );
    }
    
    // Role selection
    return (
      <Paper
        sx={{
          bgcolor: "#232b39",
          color: "#fff",
          p: 4,
          borderRadius: 3,
          maxWidth: 400,
          width: "100%",
          boxShadow: "0 4px 24px #0002",
          textAlign: "center",
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ color: "#fff" }}>
          Login as:
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          fullWidth
          sx={{ mb: 2 }}
          onClick={() => setLoginRole("patient")}
        >
          Patient
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          fullWidth
          onClick={() => setLoginRole("doctor")}
        >
          Doctor
        </Button>
      </Paper>
    );
  };

  return (
    <Box sx={{ bgcolor: "#181f2a", minHeight: "100vh", color: "#fff" }}>
      <AppBar position="static" sx={{ bgcolor: "#11151c", boxShadow: "none" }}>
        <Toolbar>
          <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 700 }}>
            DAppHealthGuard (Blockchain)
          </Typography>
          <Button color="inherit" onClick={() => handleNav("home")}>
            Home
          </Button>
          <Button color="inherit" onClick={() => handleNav("register")}>
            Register
          </Button>
          <Button color="inherit" onClick={() => handleNav("login")}>
            Login
          </Button>
          {currentUser && (
            <Button 
              color="inherit" 
              onClick={handleLogout}
              sx={{ 
                color: "#ff6b6b",
                "&:hover": {
                  backgroundColor: "#ff6b6b",
                  color: "#fff"
                }
              }}
            >
              Logout
            </Button>
          )}
          {currentUser && (
            <Typography variant="body2" sx={{ mr: 2, color: "#4fc3f7" }}>
              Welcome, {currentUser.name || currentUser.regId} ({userRole})
            </Typography>
          )}
          <Button
            color="inherit"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              try {
                await ensureWalletConnected(setSnackbar, setLoading);
                setSnackbar({ open: true, message: "Wallet connected to blockchain!", severity: "success" });
              } catch (err) {
                if (!err.message?.includes("Already processing eth_requestAccounts")) {
                  setSnackbar({ open: true, message: err.message || "Please install MetaMask!", severity: "error" });
                }
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? "Connecting..." : "Connect Wallet"}
          </Button>
        </Toolbar>
      </AppBar>

      {page === "home" && (
        <Box>
          {/* Hero Section */}
          <Container maxWidth="lg" sx={{ mt: 6, mb: 8 }}>
            <Box
              sx={{
                background: 'linear-gradient(135deg, #232b39 0%, #1a1f2e 100%)',
                borderRadius: 4,
                p: 6,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'radial-gradient(circle at 30% 20%, rgba(0, 230, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(0, 255, 153, 0.1) 0%, transparent 50%)',
                  pointerEvents: 'none'
                }
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Typography
                  variant="h2"
                  align="center"
                  sx={{
                    mb: 3,
                    fontWeight: 800,
                    background: 'linear-gradient(45deg, #00e6ff, #00ff99, #4fc3f7)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 30px rgba(0, 230, 255, 0.3)',
                    letterSpacing: 2,
                    fontSize: { xs: '2.5rem', md: '3.5rem' }
                  }}
                >
                  🏥 DAppHealthGuard
                </Typography>
                
                <Typography
                  variant="h5"
                  align="center"
                  sx={{
                    mb: 4,
                    color: '#4fc3f7',
                    fontWeight: 300,
                    fontSize: { xs: '1.2rem', md: '1.5rem' }
                  }}
                >
                  Revolutionary Blockchain Healthcare Platform
                </Typography>

                <Typography
                  variant="h6"
                  align="center"
                  sx={{
                    mb: 6,
                    color: '#fff',
                    fontWeight: 400,
                    maxWidth: '800px',
                    mx: 'auto',
                    lineHeight: 1.6,
                    fontSize: { xs: '1rem', md: '1.1rem' }
                  }}
                >
                  Secure, intelligent, and decentralized healthcare management powered by blockchain technology, 
                  machine learning, and real-time health insights for patients and doctors worldwide.
                </Typography>

                {/* Feature Cards */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, 
                  gap: 3, 
                  mb: 6 
                }}>
                  <Paper sx={{
                    p: 3,
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(79, 195, 247, 0.3)',
                    borderRadius: 3,
                    textAlign: 'center',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 30px rgba(79, 195, 247, 0.3)',
                      borderColor: '#4fc3f7'
                    }
                  }}>
                    <Typography sx={{ fontSize: '3rem', mb: 2 }}>🔒</Typography>
                    <Typography variant="h6" sx={{ color: '#4fc3f7', mb: 1, fontWeight: 600 }}>
                      Blockchain Security
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff', opacity: 0.8 }}>
                      Immutable and transparent health records stored on decentralized blockchain
                    </Typography>
                  </Paper>

                  <Paper sx={{
                    p: 3,
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(0, 255, 153, 0.3)',
                    borderRadius: 3,
                    textAlign: 'center',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 30px rgba(0, 255, 153, 0.3)',
                      borderColor: '#00ff99'
                    }
                  }}>
                    <Typography sx={{ fontSize: '3rem', mb: 2 }}>🤖</Typography>
                    <Typography variant="h6" sx={{ color: '#00ff99', mb: 1, fontWeight: 600 }}>
                      AI Health Insights
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff', opacity: 0.8 }}>
                      Advanced machine learning for risk assessment and health predictions
                    </Typography>
                  </Paper>

                  <Paper sx={{
                    p: 3,
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(0, 230, 255, 0.3)',
                    borderRadius: 3,
                    textAlign: 'center',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 30px rgba(0, 230, 255, 0.3)',
                      borderColor: '#00e6ff'
                    }
                  }}>
                    <Typography sx={{ fontSize: '3rem', mb: 2 }}>💬</Typography>
                    <Typography variant="h6" sx={{ color: '#00e6ff', mb: 1, fontWeight: 600 }}>
                      Secure Communication
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff', opacity: 0.8 }}>
                      Encrypted messaging and appointment management between patients and doctors
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            </Box>
          </Container>

          {/* Healthcare Professional Section */}
          <Container maxWidth="lg" sx={{ mb: 8 }}>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
              gap: 4 
            }}>
              {/* Patient Section */}
              <Paper sx={{
                p: 4,
                bgcolor: 'rgba(35, 43, 57, 0.9)',
                borderRadius: 3,
                border: '1px solid rgba(79, 195, 247, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.02)',
                  boxShadow: '0 15px 35px rgba(79, 195, 247, 0.2)'
                }
              }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography sx={{ fontSize: '5rem', mb: 2 }}>👨‍⚕️</Typography>
                  <Typography variant="h4" sx={{ color: '#4fc3f7', fontWeight: 700, mb: 2 }}>
                    For Patients
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#fff', mb: 3, opacity: 0.9 }}>
                    Take control of your health with secure, blockchain-based medical records and AI-powered health insights.
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  {[
                    '🏥 Request appointments with doctors',
                    '📊 AI-powered health risk assessment',
                    '💬 Secure chat with healthcare providers',
                    '📱 Real-time health monitoring',
                    '🔐 Complete data privacy and ownership'
                  ].map((feature, index) => (
                    <Typography key={index} variant="body2" sx={{ 
                      color: '#fff', 
                      mb: 1, 
                      display: 'flex', 
                      alignItems: 'center',
                      opacity: 0.8
                    }}>
                      {feature}
                    </Typography>
                  ))}
                </Box>
              </Paper>

              {/* Doctor Section */}
              <Paper sx={{
                p: 4,
                bgcolor: 'rgba(35, 43, 57, 0.9)',
                borderRadius: 3,
                border: '1px solid rgba(0, 255, 153, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.02)',
                  boxShadow: '0 15px 35px rgba(0, 255, 153, 0.2)'
                }
              }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography sx={{ fontSize: '5rem', mb: 2 }}>👩‍⚕️</Typography>
                  <Typography variant="h4" sx={{ color: '#00ff99', fontWeight: 700, mb: 2 }}>
                    For Doctors
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#fff', mb: 3, opacity: 0.9 }}>
                    Enhance patient care with comprehensive health data, AI insights, and streamlined appointment management.
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  {[
                    '📋 Manage patient appointments efficiently',
                    '🔍 Access comprehensive patient history',
                    '💬 Secure communication with patients',
                    '📊 AI-assisted diagnosis support',
                    '⚡ Real-time patient health monitoring'
                  ].map((feature, index) => (
                    <Typography key={index} variant="body2" sx={{ 
                      color: '#fff', 
                      mb: 1, 
                      display: 'flex', 
                      alignItems: 'center',
                      opacity: 0.8
                    }}>
                      {feature}
                    </Typography>
                  ))}
                </Box>
              </Paper>
            </Box>
          </Container>

          {/* Call to Action Section */}
          <Container maxWidth="md" sx={{ mb: 8, textAlign: 'center' }}>
            <Paper sx={{
              p: 6,
              bgcolor: 'rgba(35, 43, 57, 0.9)',
              borderRadius: 4,
              border: '1px solid rgba(0, 230, 255, 0.3)',
              background: 'linear-gradient(135deg, rgba(35, 43, 57, 0.9) 0%, rgba(26, 31, 46, 0.9) 100%)'
            }}>
              <Typography variant="h4" sx={{ 
                color: '#00e6ff', 
                fontWeight: 700, 
                mb: 3,
                textShadow: '0 0 20px rgba(0, 230, 255, 0.5)'
              }}>
                Ready to Transform Healthcare?
              </Typography>
              <Typography variant="h6" sx={{ color: '#fff', mb: 4, opacity: 0.9 }}>
                Join thousands of patients and doctors already using DAppHealthGuard
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => handleNav("register")}
                  sx={{
                    px: 4,
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    background: 'linear-gradient(45deg, #4fc3f7, #00e6ff)',
                    borderRadius: 3,
                    textTransform: 'none',
                    boxShadow: '0 8px 25px rgba(79, 195, 247, 0.4)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #29b6f6, #00bcd4)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 35px rgba(79, 195, 247, 0.6)'
                    }
                  }}
                >
                  🚀 Get Started
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => handleNav("login")}
                  sx={{
                    px: 4,
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderColor: '#00ff99',
                    color: '#00ff99',
                    borderRadius: 3,
                    textTransform: 'none',
                    borderWidth: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(0, 255, 153, 0.1)',
                      borderColor: '#00ff99',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0, 255, 153, 0.3)'
                    }
                  }}
                >
                  🔑 Sign In
                </Button>
              </Box>
            </Paper>
          </Container>
          
          {/* Copyright Footer - Only on Homepage */}
          <Box
            component="footer"
            sx={{
              backgroundColor: '#2c3e50',
              color: '#ecf0f1',
              textAlign: 'center',
              py: 3,
              mt: 6,
              borderTop: '3px solid #3498db'
            }}
          >
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                letterSpacing: '0.5px'
              }}
            >
              © 2025 Healthcare DApp | Developed by <strong>MASTER BADRISH</strong>, B.Tech 4th Year (CSE)
              <br />
              <Typography
                component="span"
                sx={{
                  fontSize: '12px',
                  opacity: 0.8
                }}
              >
                Under supervision of Dr. Ditipriya, NIT Patna
              </Typography>
            </Typography>
          </Box>
        </Box>
      )}

      {page === "register" && (
        <Container sx={{ mt: 8, display: "flex", justifyContent: "center" }}>
          {renderRegisterForm()}
        </Container>
      )}

      {page === "login" && (
        <Container sx={{ mt: 8, display: "flex", justifyContent: "center" }}>
          {renderLoginForm()}
        </Container>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, appointmentId: null })}
        PaperProps={{
          sx: {
            bgcolor: "#232b39",
            color: "#fff",
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ color: "#fff", textAlign: "center" }}>
          🗑️ Delete Appointment
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#fff", textAlign: "center" }}>
            Are you sure you want to delete this appointment?
          </Typography>
          <Typography sx={{ color: "#ff6b6b", textAlign: "center", mt: 1, fontSize: "0.9rem" }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
          <Button
            onClick={() => setDeleteDialog({ open: false, appointmentId: null })}
            sx={{ color: "#fff", borderColor: "#fff" }}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={() => deleteAppointment(deleteDialog.appointmentId)}
            sx={{ 
              backgroundColor: "#ff6b6b", 
              color: "#fff",
              "&:hover": {
                backgroundColor: "#ff5252"
              }
            }}
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;