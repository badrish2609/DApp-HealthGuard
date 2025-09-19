import { useEffect, useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import Healthcare from "../contracts/Healthcare.json";

const contractAddress = "0xecDc82F3b1A12CC5F7DaC276F83612567cbcAc90";

const useContract = () => {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getContract = async () => {
      try {
        if (!window.ethereum) throw new Error("MetaMask not detected");
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contractInstance = new Contract(contractAddress, Healthcare.abi, signer);
        setContract(contractInstance);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    getContract();
  }, []);

  return { contract, loading, error };
};

export default useContract;