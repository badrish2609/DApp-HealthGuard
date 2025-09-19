import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import abi from "../abi";
import { CONTRACT_ADDRESS } from "../config";

const PatientRegister = () => {
  const [form, setForm] = useState({
    name: "",
    age: "",
    email: "",
    patientId: ""
  });

  const [status, setStatus] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  // Check MetaMask connection on component mount
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (window.ethereum) {
        try {
          await window.ethereum.request({ method: "eth_requestAccounts" });
          setIsConnected(true);
        } catch (err) {
          console.error("User denied account access", err);
          setStatus("❌ MetaMask connection rejected.");
        }
      } else {
        setStatus("❌ MetaMask not detected.");
      }
    };

    checkWalletConnection();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const emailRegex = /\S+@\S+\.\S+/;
    const idRegex = /^[a-zA-Z0-9]+$/;
    return (
      form.name &&
      form.age &&
      emailRegex.test(form.email) &&
      idRegex.test(form.patientId)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");

    if (!validateForm()) {
      setStatus("❌ Please fill all fields correctly.");
      return;
    }

    try {
      if (!window.ethereum) throw new Error("MetaMask not available");

      await window.ethereum.request({ method: "eth_requestAccounts" });

      const provider = new ethers.providers.Web3Provider(window.ethereum); // ✅ v5 syntax
      const signer = provider.getSigner();

      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

      const tx = await contract.registerPatient(
        form.name,
        parseInt(form.age),
        form.email,
        form.patientId
      );

      setStatus("⏳ Waiting for transaction confirmation...");
      await tx.wait();

      setStatus("✅ Patient registered successfully!");
      setForm({ name: "", age: "", email: "", patientId: "" });
    } catch (err) {
      console.error("Transaction failed:", err);
      setStatus(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div style={{ margin: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>🧑‍⚕️ Patient Registration</h2>
      {isConnected ? (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            required
          /><br /><br />

          <input
            type="number"
            name="age"
            placeholder="Age"
            value={form.age}
            onChange={handleChange}
            required
          /><br /><br />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          /><br /><br />

          <input
            type="text"
            name="patientId"
            placeholder="Patient ID (alphanumeric)"
            value={form.patientId}
            onChange={handleChange}
            required
          /><br /><br />

          <button type="submit">Register Patient</button>
        </form>
      ) : (
        <p>⛔ Please connect MetaMask to continue.</p>
      )}

      <p style={{ marginTop: "10px", color: status.startsWith("✅") ? "green" : "red" }}>
        {status}
      </p>
    </div>
  );
};

export default PatientRegister;
