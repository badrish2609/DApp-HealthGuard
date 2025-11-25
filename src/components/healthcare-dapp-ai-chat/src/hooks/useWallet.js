import { useState, useEffect } from "react";
import { BrowserProvider } from "ethers";

const useWallet = () => {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("MetaMask is not installed");
      return;
    }

    setLoading(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
  };

  useEffect(() => {
    const checkWalletConnection = async () => {
      if (!window.ethereum) return;

      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_accounts", []);
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      }
    };

    checkWalletConnection();
  }, []);

  return { account, loading, error, connectWallet, disconnectWallet };
};

export default useWallet;