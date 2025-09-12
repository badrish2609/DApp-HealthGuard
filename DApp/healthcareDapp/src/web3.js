import Web3 from 'web3';

let web3;

if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
  // Modern MetaMask
  web3 = new Web3(window.ethereum);
  console.log('🔗 Using MetaMask provider');
} else {
  // Fallback to Ganache
  const provider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');
  web3 = new Web3(provider);
  console.log('🔗 Using Ganache fallback provider');
}

export default web3;