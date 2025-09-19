import axios from 'axios';

const API_URL = process.env.REACT_APP_AI_SERVICE_URL; // Ensure this is set in your .env file

export const analyzeHealthData = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/analyze`, data);
    return response.data;
  } catch (error) {
    console.error("Error analyzing health data:", error);
    throw new Error("Failed to analyze health data");
  }
};

export const getHealthInsights = async (patientId) => {
  try {
    const response = await axios.get(`${API_URL}/insights/${patientId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching health insights:", error);
    throw new Error("Failed to fetch health insights");
  }
};