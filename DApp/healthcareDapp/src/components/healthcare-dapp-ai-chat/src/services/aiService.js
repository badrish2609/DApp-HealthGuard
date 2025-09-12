import axios from 'axios';

const AI_SERVICE_URL = process.env.REACT_APP_AI_SERVICE_URL || 'https://api.example.com/ai'; // Replace with your AI service URL

export const sendMessageToAI = async (message) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/send`, { message });
    return response.data;
  } catch (error) {
    console.error('Error sending message to AI:', error);
    throw new Error('Failed to send message to AI service');
  }
};

export const getAIResponse = async (conversationHistory) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/response`, { history: conversationHistory });
    return response.data;
  } catch (error) {
    console.error('Error getting AI response:', error);
    throw new Error('Failed to get response from AI service');
  }
};