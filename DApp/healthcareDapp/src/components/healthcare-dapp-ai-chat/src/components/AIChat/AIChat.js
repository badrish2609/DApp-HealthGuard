import React, { useState } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { sendMessageToAI } from '../../services/aiService';

const AIChat = () => {
  const [messages, setMessages] = useState([]);

  const handleSendMessage = async (message) => {
    const userMessage = { content: message, sender: 'user' };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    try {
      const aiResponse = await sendMessageToAI(message);
      const aiMessage = { content: aiResponse, sender: 'ai' };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error('Error sending message to AI:', error);
      const errorMessage = { content: 'Error communicating with AI.', sender: 'ai' };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    }
  };

  return (
    <div className="ai-chat">
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
      </div>
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default AIChat;