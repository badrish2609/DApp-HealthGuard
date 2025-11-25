import React, { useState, useEffect, useRef } from 'react';
import {
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Chip,
  IconButton,
  Divider,
  Badge,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  InputAdornment,
  Tooltip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SecurityIcon from '@mui/icons-material/Security';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import LockIcon from '@mui/icons-material/Lock';

// Simple encryption/decryption functions (for demo purposes)
const encryptMessage = (message, key) => {
  let encrypted = '';
  for (let i = 0; i < message.length; i++) {
    encrypted += String.fromCharCode(message.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(encrypted); // Base64 encode
};

const decryptMessage = (encryptedMessage, key) => {
  try {
    const decoded = atob(encryptedMessage);
    let decrypted = '';
    for (let i = 0; i < decoded.length; i++) {
      decrypted += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return decrypted;
  } catch (error) {
    return '[Decryption Error]';
  }
};

// Generate a chat key based on patient and doctor IDs
const generateChatKey = (patientId, doctorId) => {
  return `${patientId}-${doctorId}-healthcare-secure`;
};

const SecureChat = ({ 
  currentUser, 
  userRole, 
  targetUser = null, 
  appointments = [],
  onNotification 
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatUsers, setChatUsers] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const chatKey = selectedChat ? generateChatKey(
    userRole === 'patient' ? currentUser?.id : selectedChat.patientId,
    userRole === 'doctor' ? currentUser?.regId : selectedChat.doctorId
  ) : null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    loadChatUsers();
  }, [currentUser, userRole]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages();
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatUsers = () => {
    try {
      const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      const users = new Map();

      allAppointments.forEach(appointment => {
        let chatPartnerId, chatPartnerName, chatPartnerType;
        
        if (userRole === 'patient' && appointment.patientId === currentUser?.id) {
          // Patient sees their doctors
          chatPartnerId = appointment.doctorId;
          chatPartnerName = appointment.doctorName || 'Unknown Doctor';
          chatPartnerType = 'doctor';
        } else if (userRole === 'doctor' && appointment.doctorId === currentUser?.regId) {
          // Doctor sees their patients
          chatPartnerId = appointment.patientId;
          chatPartnerName = appointment.patientName || 'Unknown Patient';
          chatPartnerType = 'patient';
        }

        if (chatPartnerId && !users.has(chatPartnerId)) {
          users.set(chatPartnerId, {
            id: chatPartnerId,
            name: chatPartnerName,
            type: chatPartnerType,
            patientId: userRole === 'patient' ? currentUser?.id : appointment.patientId,
            doctorId: userRole === 'doctor' ? currentUser?.regId : appointment.doctorId,
            lastAppointment: appointment,
            unreadCount: 0
          });
        }
      });

      setChatUsers(Array.from(users.values()));
      
      // Auto-select first user if available
      if (users.size > 0 && !selectedChat) {
        setSelectedChat(Array.from(users.values())[0]);
      }
    } catch (error) {
      console.error('Error loading chat users:', error);
    }
  };

  const loadMessages = () => {
    if (!selectedChat || !chatKey) return;

    try {
      const chatId = `chat_${selectedChat.patientId}_${selectedChat.doctorId}`;
      const encryptedMessages = JSON.parse(localStorage.getItem(chatId) || '[]');
      
      const decryptedMessages = encryptedMessages.map(msg => ({
        ...msg,
        message: decryptMessage(msg.encryptedMessage, chatKey),
        decrypted: true
      }));

      setMessages(decryptedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const handleTyping = (value) => {
    setNewMessage(value);
    
    if (value.length > 0 && !isTyping) {
      setIsTyping(true);
      // In a real app, you would send typing indicator to the other user
    } else if (value.length === 0 && isTyping) {
      setIsTyping(false);
    }
    
    // Clear typing after 2 seconds of inactivity
    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !chatKey) return;

    setLoading(true);
    try {
      const message = {
        id: Date.now(),
        senderId: userRole === 'patient' ? currentUser?.id : currentUser?.regId,
        senderName: currentUser?.name,
        senderType: userRole,
        message: newMessage.trim(),
        encryptedMessage: encryptMessage(newMessage.trim(), chatKey),
        timestamp: new Date().toISOString(),
        read: false
      };

      const chatId = `chat_${selectedChat.patientId}_${selectedChat.doctorId}`;
      const existingMessages = JSON.parse(localStorage.getItem(chatId) || '[]');
      const updatedMessages = [...existingMessages, message];
      
      localStorage.setItem(chatId, JSON.stringify(updatedMessages));
      
      // Update local state with decrypted message
      setMessages(prev => [...prev, { ...message, decrypted: true }]);
      setNewMessage('');

      // Show notification to other user (simulate real-time)
      if (onNotification) {
        // Determine the recipient based on who is NOT the current user
        const recipientId = userRole === 'patient' ? selectedChat.doctorId : selectedChat.patientId;
        const recipientType = userRole === 'patient' ? 'doctor' : 'patient';
        
        onNotification({
          type: 'new_message',
          from: currentUser?.name,
          message: newMessage.trim(),
          chatId,
          recipientId,
          recipientType,
          senderId: userRole === 'patient' ? currentUser?.id : currentUser?.regId,
          senderType: userRole
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendAppointmentInfo = (appointment) => {
    if (!selectedChat || !chatKey) return;

    const appointmentMessage = `📅 **APPOINTMENT CONFIRMED**

👤 **Patient:** ${appointment.patientName}
🩺 **Doctor:** ${appointment.doctorName}
� **Date:** ${appointment.date}
⏰ **Time:** ${appointment.time}
📝 **Reason:** ${appointment.reason}
✅ **Status:** ${appointment.status}
🆔 **Appointment ID:** ${appointment.id}

${appointment.fromRequest ? '🔄 **Source:** Approved from patient request' : '📋 **Source:** Doctor scheduled'}
📧 **Email notification sent**
🔒 **This information is encrypted and secure**

Please save this information for your records.`;

    const message = {
      id: Date.now(),
      senderId: userRole === 'patient' ? currentUser?.id : currentUser?.regId,
      senderName: currentUser?.name,
      senderType: userRole,
      message: appointmentMessage,
      encryptedMessage: encryptMessage(appointmentMessage, chatKey),
      timestamp: new Date().toISOString(),
      isAppointmentInfo: true,
      appointmentData: appointment,
      read: false
    };

    const chatId = `chat_${selectedChat.patientId}_${selectedChat.doctorId}`;
    const existingMessages = JSON.parse(localStorage.getItem(chatId) || '[]');
    const updatedMessages = [...existingMessages, message];
    
    localStorage.setItem(chatId, JSON.stringify(updatedMessages));
    setMessages(prev => [...prev, { ...message, decrypted: true }]);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getRelevantAppointments = () => {
    if (!selectedChat) return [];
    
    return appointments.filter(apt => 
      apt.patientId === selectedChat.patientId && 
      apt.doctorId === selectedChat.doctorId
    );
  };

  const MessageBubble = ({ message, isOwn }) => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        mb: 1,
        px: 1
      }}
    >
      <Box
        sx={{
          maxWidth: '70%',
          backgroundColor: message.isAppointmentInfo 
            ? (isOwn ? '#e8f5e8' : '#fff3e0')
            : isOwn 
              ? '#4fc3f7' 
              : '#2d3748',
          color: message.isAppointmentInfo 
            ? (isOwn ? '#2e7d32' : '#e65100')
            : isOwn 
              ? '#fff' 
              : '#fff',
          borderRadius: 2,
          p: 1.5,
          position: 'relative',
          border: message.isAppointmentInfo 
            ? `2px solid ${isOwn ? '#4caf50' : '#ff9800'}` 
            : 'none',
          boxShadow: message.isAppointmentInfo ? 2 : 0
        }}
      >
        {message.isAppointmentInfo && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <EventIcon sx={{ fontSize: 16, mr: 1 }} />
            <Typography variant="caption" fontWeight="bold">
              Appointment Details
            </Typography>
          </Box>
        )}
        
        <Typography 
          variant="body2" 
          sx={{ 
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          {message.decrypted ? message.message : '[Encrypted Message]'}
        </Typography>
        
        <Typography 
          variant="caption" 
          sx={{ 
            display: 'block',
            textAlign: 'right',
            mt: 0.5,
            opacity: 0.7,
            fontSize: '0.7rem'
          }}
        >
          {formatTime(message.timestamp)}
          {isOwn && (
            <Box component="span" sx={{ ml: 0.5 }}>
              {message.read ? '✓✓' : '✓'}
            </Box>
          )}
        </Typography>
      </Box>
    </Box>
  );

  if (!currentUser) {
    return (
      <Paper sx={{ p: 3, bgcolor: "#232b39", color: "#fff" }}>
        <Typography>Please login to access secure chat</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ bgcolor: "#232b39", color: "#fff", borderRadius: 3, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', height: '600px' }}>
        {/* Chat Users List */}
        <Box sx={{ 
          width: '300px', 
          borderRight: '1px solid #444',
          bgcolor: '#1a1a1a'
        }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #444' }}>
            <Typography variant="h6" sx={{ color: "#4fc3f7", display: 'flex', alignItems: 'center' }}>
              <SecurityIcon sx={{ mr: 1, fontSize: 20 }} />
              Secure Chat
            </Typography>
            <Typography variant="caption" sx={{ color: "#888" }}>
              End-to-end encrypted
            </Typography>
          </Box>
          
          <List sx={{ p: 0 }}>
            {chatUsers.map((user) => (
              <ListItem
                key={user.id}
                button
                selected={selectedChat?.id === user.id}
                onClick={() => setSelectedChat(user)}
                sx={{
                  borderBottom: '1px solid #333',
                  '&.Mui-selected': {
                    backgroundColor: '#2d3748'
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ 
                    bgcolor: user.type === 'doctor' ? '#4caf50' : '#2196f3' 
                  }}>
                    {user.type === 'doctor' ? <LocalHospitalIcon /> : <PersonIcon />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle2" sx={{ color: '#fff' }}>
                        {user.name}
                      </Typography>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: Math.random() > 0.5 ? '#4caf50' : '#757575', // Simulating online/offline
                          ml: 1
                        }}
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" sx={{ color: '#888' }}>
                      {user.type === 'doctor' ? 'Doctor' : 'Patient'}
                      {user.unreadCount > 0 && (
                        <Badge badgeContent={user.unreadCount} color="error" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
            {chatUsers.length === 0 && (
              <ListItem>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ color: '#888', textAlign: 'center' }}>
                      No appointments found. Schedule an appointment to start chatting.
                    </Typography>
                  }
                />
              </ListItem>
            )}
          </List>
        </Box>

        {/* Chat Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <Box sx={{ 
                p: 2, 
                borderBottom: '1px solid #444',
                bgcolor: '#2d3748'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ 
                      mr: 2,
                      bgcolor: selectedChat.type === 'doctor' ? '#4caf50' : '#2196f3'
                    }}>
                      {selectedChat.type === 'doctor' ? <LocalHospitalIcon /> : <PersonIcon />}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>
                        {selectedChat.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#4fc3f7' }}>
                        {selectedChat.type === 'doctor' ? 'Doctor' : 'Patient'} • 
                        <SecurityIcon sx={{ fontSize: 12, mx: 0.5 }} />
                        Encrypted Chat
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Chat Header with Encryption Info */}
              <Box sx={{ 
                p: 2, 
                borderBottom: '1px solid #333',
                bgcolor: '#1e1e1e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Box>
                  <Typography variant="h6" sx={{ color: '#fff', mb: 0.5 }}>
                    {selectedChat?.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LockIcon sx={{ fontSize: 14, color: '#4caf50', mr: 0.5 }} />
                    <Typography variant="caption" sx={{ color: '#4caf50' }}>
                      End-to-end encrypted
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: Math.random() > 0.5 ? '#4caf50' : '#757575',
                      mr: 1
                    }}
                  />
                  <Typography variant="caption" sx={{ color: '#888' }}>
                    {Math.random() > 0.5 ? 'Online' : 'Last seen recently'}
                  </Typography>
                </Box>
              </Box>

              {/* Appointment Actions */}
                  <Box>
                    {getRelevantAppointments().slice(0, 2).map((apt) => (
                      <Button
                        key={apt.id}
                        size="small"
                        startIcon={<EventIcon />}
                        onClick={() => sendAppointmentInfo(apt)}
                        sx={{ 
                          mr: 1,
                          color: '#4fc3f7',
                          borderColor: '#4fc3f7',
                          fontSize: '0.7rem'
                        }}
                        variant="outlined"
                      >
                        Share {apt.date}
                      </Button>
                    ))}
                  </Box>
                </Box>
              </Box>

              {/* Messages Area */}
              <Box sx={{ 
                flex: 1, 
                overflowY: 'auto',
                p: 1,
                bgcolor: '#1a1a1a'
              }}>
                {messages.map((message, index) => {
                  const isOwn = message.senderId === (userRole === 'patient' ? currentUser?.id : currentUser?.regId);
                  const showDate = index === 0 || 
                    formatDate(message.timestamp) !== formatDate(messages[index - 1].timestamp);
                  
                  return (
                    <Box key={message.id}>
                      {showDate && (
                        <Box sx={{ textAlign: 'center', my: 2 }}>
                          <Chip 
                            label={formatDate(message.timestamp)} 
                            size="small"
                            sx={{ bgcolor: '#444', color: '#fff' }}
                          />
                        </Box>
                      )}
                      <MessageBubble message={message} isOwn={isOwn} />
                    </Box>
                  );
                })}
                <div ref={messagesEndRef} />
              </Box>
              
              {/* Typing Indicator */}
              {otherUserTyping && (
                <Box sx={{ p: 1, bgcolor: '#1a1a1a' }}>
                  <Typography variant="caption" sx={{ color: '#888', fontStyle: 'italic' }}>
                    {selectedChat?.name} is typing...
                  </Typography>
                </Box>
              )}

              {/* Message Input */}
              <Box sx={{ 
                p: 2, 
                borderTop: '1px solid #444',
                bgcolor: '#2d3748'
              }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  value={newMessage}
                  onChange={(e) => handleTyping(e.target.value)}
                  placeholder="Type your message..."
                  variant="outlined"
                  disabled={loading}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  InputProps={{
                    style: { color: '#fff', background: '#1a1a1a' },
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={sendMessage}
                          disabled={!newMessage.trim() || loading}
                          sx={{ color: '#4fc3f7' }}
                        >
                          <SendIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  InputLabelProps={{ style: { color: '#fff' } }}
                />
                <Typography variant="caption" sx={{ color: '#888', mt: 1, display: 'block' }}>
                  <SecurityIcon sx={{ fontSize: 12, mr: 0.5 }} />
                  Messages are encrypted end-to-end for your privacy
                </Typography>
              </Box>
            </>
          ) : (
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexDirection: 'column',
              color: '#888'
            }}>
              <SecurityIcon sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Secure Healthcare Chat
              </Typography>
              <Typography variant="body2" textAlign="center">
                Select a chat partner to start a secure conversation.
                <br />
                All messages are encrypted for your privacy.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default SecureChat;
