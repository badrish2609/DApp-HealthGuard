import { useState } from 'react';

export const useChat = () => {
  const [messages, setMessages] = useState([]);

  const addMessage = (message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  };

  const clearChat = () => {
    setMessages([]);
  };

  return {
    messages,
    addMessage,
    clearChat,
  };
};

export const formatMessage = (message, sender) => {
  return {
    id: Date.now(),
    content: message,
    sender,
    timestamp: new Date().toISOString(),
  };
};