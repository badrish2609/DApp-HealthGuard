import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

import Healthcare from './abi/Healthcare.json';
import { contractAddress } from './config';

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [formType, setFormType] = useState(null);

  const [patient, setPatient] = useState({ name: '', age: '', email: '', id: '' });
  const [doctor, setDoctor] = useState({ name: '', doctorId: '', specialization: '' });

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', () => window.location.reload());
    }
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask');
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const instance = new ethers.Contract(contractAddress, Healthcare.abi, signer);

      setAccount(accounts[0]);
      setContract(instance);
    } catch (err) {
      console.error(err);
      alert('Failed to connect MetaMask.');
    }
  };

  const registerPatient = async () => {
    const { name, age, email, id } = patient;
    if (!name || !age || !email || !id) return alert('All patient fields are required.');

    try {
      const tx = await contract.registerPatient(name, age, email, id);
      await tx.wait();
      alert('✅ Patient registered!');
    } catch (err) {
      console.error(err);
      alert('❌ Patient registration failed.');
    }
  };

  const registerDoctor = async () => {
    const { name, doctorId, specialization } = doctor;
    if (!name || !doctorId || !specialization) return alert('All doctor fields are required.');

    try {
      const tx = await contract.registerDoctor(name, doctorId, specialization);
      await tx.wait();
      alert('✅ Doctor registered!');
    } catch (err) {
      console.error(err);
      alert('❌ Doctor registration failed.');
    }
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial' }}>
      <h2>🩺 Healthcare DApp</h2>

      {!account ? (
        <button onClick={connectWallet}>🔗 Connect MetaMask</button>
      ) : (
        <>
          <p><strong>Connected Account:</strong> {account}</p>
          <h3>Register As:</h3>
          <button onClick={() => setFormType('patient')}>🧍 Patient</button>{' '}
          <button onClick={() => setFormType('doctor')}>👨‍⚕ Doctor</button>

          {formType === 'patient' && (
            <>
              <h3>🧍 Patient Registration</h3>
              <input placeholder="Name" onChange={e => setPatient({ ...patient, name: e.target.value })} /><br />
              <input placeholder="Age" onChange={e => setPatient({ ...patient, age: e.target.value })} /><br />
              <input placeholder="Email" onChange={e => setPatient({ ...patient, email: e.target.value })} /><br />
              <input placeholder="Patient ID" onChange={e => setPatient({ ...patient, id: e.target.value })} /><br />
              <button onClick={registerPatient}>Register Patient</button>
            </>
          )}

          {formType === 'doctor' && (
            <>
              <h3>👨‍⚕ Doctor Registration</h3>
              <input placeholder="Name" onChange={e => setDoctor({ ...doctor, name: e.target.value })} /><br />
              <input placeholder="Doctor ID" onChange={e => setDoctor({ ...doctor, doctorId: e.target.value })} /><br />
              <input placeholder="Specialization" onChange={e => setDoctor({ ...doctor, specialization: e.target.value })} /><br />
              <button onClick={registerDoctor}>Register Doctor</button>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;
