import { BrowserProvider, Contract } from "ethers";
import Healthcare from "../contracts/Healthcare.json";

const contractAddress = "0xecDc82F3b1A12CC5F7DaC276F83612567cbcAc90";

async function getContract() {
  if (!window.ethereum) throw new Error("MetaMask not detected");
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new Contract(contractAddress, Healthcare.abi, signer);
}

async function connectWallet() {
  if (!window.ethereum) throw new Error("MetaMask not detected");
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  return accounts[0];
}

async function sendTransaction(transactionData) {
  const contract = await getContract();
  const tx = await contract.someFunction(transactionData);
  return await tx.wait();
}

export { getContract, connectWallet, sendTransaction };