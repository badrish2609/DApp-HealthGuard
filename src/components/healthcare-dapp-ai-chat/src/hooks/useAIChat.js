import { useState, useEffect } from 'react';
import { sendMessageToAI } from '../services/aiService';

const useAIChat = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (message) => {
    setMessages((prevMessages) => [...prevMessages, { text: message, sender: 'user' }]);
    setLoading(true);
    
    try {
      const response = await sendMessageToAI(message);
      setMessages((prevMessages) => [...prevMessages, { text: response, sender: 'ai' }]);
    } catch (error) {
      console.error('Error sending message to AI:', error);
      setMessages((prevMessages) => [...prevMessages, { text: 'Error: Unable to get response from AI.', sender: 'ai' }]);
    } finally {
      setLoading(false);
    }
  };

  return {
    messages,
    loading,
    sendMessage,
  };
};

export default useAIChat;