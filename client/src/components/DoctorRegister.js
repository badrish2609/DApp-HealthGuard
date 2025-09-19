// components/DoctorRegister.js
import React, { useState } from 'react';
import { ethers } from 'ethers';
import abi from '../abi';
import { CONTRACT_ADDRESS } from '../config';

function DoctorRegister() {
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [message, setMessage] = useState('');

  const handleRegister = async () => {
    try {
      if (!window.ethereum) throw new Error("MetaMask not installed");
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

      const tx = await contract.registerDoctor(name, id, specialization);
      await tx.wait();
      setMessage("Doctor registered successfully!");
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow">
      <h2 className="text-xl font-bold">Doctor Registration</h2>
      <input type="text" placeholder="Name" onChange={(e) => setName(e.target.value)} className="block p-2 my-2 border" />
      <input type="text" placeholder="Doctor ID" onChange={(e) => setId(e.target.value)} className="block p-2 my-2 border" />
      <input type="text" placeholder="Specialization" onChange={(e) => setSpecialization(e.target.value)} className="block p-2 my-2 border" />
      <button onClick={handleRegister} className="px-4 py-2 bg-blue-500 text-white rounded">Register</button>
      <p className="mt-2 text-green-700">{message}</p>
    </div>
  );
}

export default DoctorRegister;
