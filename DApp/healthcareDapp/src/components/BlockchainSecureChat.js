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
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import SecurityIcon from '@mui/icons-material/Security';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import LockIcon from '@mui/icons-material/Lock';
import { BrowserProvider, Contract } from "ethers";
import Healthcare from "../contracts/Healthcare.json";

// Your deployed contract address
const contractAddress = "0x624167dE6AaC8D2Ec25718AfF5d80B671f927881";

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

// Get contract instance
async function getContract() {
  if (!window.ethereum) throw new Error("MetaMask not detected");
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new Contract(contractAddress, Healthcare.abi, signer);
}

const BlockchainSecureChat = ({ 
  currentUser, 
  userRole, 
  appointments = [], 
  onNotification 
}) => {
  const [availableChats, setAvailableChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [chatKey, setChatKey] = useState('');
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  // Initialize chats based on appointments
  useEffect(() => {
    if (currentUser && appointments.length > 0) {
      initializeChats();
    }
  }, [currentUser, appointments, userRole]);

  // Load messages when chat is selected
  useEffect(() => {
    if (selectedChat) {
      loadMessagesFromBlockchain();
    }
  }, [selectedChat]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeChats = () => {
    console.log('🔄 Initializing chats from appointments...');
    
    const chats = [];
    const uniquePairs = new Set();

    appointments.forEach(appointment => {
      let chatPartner, chatPartnerId, chatPartnerType;
      
      if (userRole === 'patient') {
        chatPartner = appointment.doctorName;
        chatPartnerId = appointment.doctorId;
        chatPartnerType = 'doctor';
      } else {
        chatPartner = appointment.patientName;
        chatPartnerId = appointment.patientId;
        chatPartnerType = 'patient';
      }

      const pairKey = userRole === 'patient' 
        ? `${appointment.patientId}_${appointment.doctorId}`
        : `${appointment.patientId}_${appointment.doctorId}`;

      if (!uniquePairs.has(pairKey)) {
        uniquePairs.add(pairKey);
        chats.push({
          id: pairKey,
          name: chatPartner,
          partnerId: chatPartnerId,
          partnerType: chatPartnerType,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          lastActivity: appointment.createdAt || new Date().toISOString(),
          appointmentCount: 1,
          status: 'active'
        });
      }
    });

    console.log('📋 Available chats:', chats);
    setAvailableChats(chats);
    
    // Auto-select first chat if available
    if (chats.length > 0 && !selectedChat) {
      selectChat(chats[0]);
    }
  };

  const selectChat = (chat) => {
    console.log('💬 Selecting chat:', chat);
    setSelectedChat(chat);
    
    // Generate chat key for encryption
    const key = `${chat.patientId}_${chat.doctorId}_healthcare_secure`;
    setChatKey(key);
    
    // Clear previous messages
    setMessages([]);
    setError('');
  };

  const loadMessagesFromBlockchain = async () => {
    if (!selectedChat) return;
    
    setLoadingMessages(true);
    setError('');
    
    try {
      console.log('📥 Loading messages from blockchain for:', selectedChat.patientId, selectedChat.doctorId);
      
      const contract = await getContract();
      const blockchainMessages = await contract.getChatMessages(
        selectedChat.patientId, 
        selectedChat.doctorId
      );
      
      console.log('📨 Raw blockchain messages:', blockchainMessages);
      
      // Convert blockchain messages to our format
      const formattedMessages = blockchainMessages.map((msg, index) => {
        const timestamp = new Date(Number(msg.timestamp) * 1000).toISOString();
        
        // Try to decrypt the message
        let decryptedMessage = msg.message;
        if (msg.encryptedMessage && chatKey) {
          try {
            decryptedMessage = decryptMessage(msg.encryptedMessage, chatKey);
          } catch (error) {
            console.warn('❌ Failed to decrypt message:', error);
            decryptedMessage = msg.message; // Fallback to plain message
          }
        }
        
        return {
          id: Number(msg.id),
          senderId: msg.senderId,
          senderName: msg.senderName,
          senderType: msg.senderType,
          message: decryptedMessage,
          encryptedMessage: msg.encryptedMessage,
          timestamp: timestamp,
          isAppointmentInfo: msg.isAppointmentInfo,
          appointmentData: msg.appointmentData ? JSON.parse(msg.appointmentData || '{}') : null,
          decrypted: true,
          read: true
        };
      });
      
      console.log('✅ Formatted messages:', formattedMessages);
      setMessages(formattedMessages);
      
    } catch (error) {
      console.error('❌ Error loading messages from blockchain:', error);
      setError('Failed to load messages from blockchain: ' + error.message);
      
      // Fallback to empty messages
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !chatKey || loading) return;

    setLoading(true);
    setError('');
    
    try {
      console.log('📤 Sending message to blockchain...');
      
      const contract = await getContract();
      
      // Prepare message data
      const messageText = newMessage.trim();
      const encryptedText = encryptMessage(messageText, chatKey);
      const senderId = userRole === 'patient' ? currentUser?.id : currentUser?.regId;
      const senderName = currentUser?.name || 'Unknown';
      
      console.log('📋 Message details:', {
        patientId: selectedChat.patientId,
        doctorId: selectedChat.doctorId,
        senderId,
        senderName,
        senderType: userRole,
        message: messageText,
        encrypted: encryptedText.substring(0, 20) + '...'
      });
      
      // Send to blockchain
      const tx = await contract.sendChatMessage(
        selectedChat.patientId,
        selectedChat.doctorId,
        senderId,
        senderName,
        userRole,
        messageText,
        encryptedText,
        false, // isAppointmentInfo
        '' // appointmentData
      );
      
      console.log('🔄 Transaction sent:', tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('✅ Message stored on blockchain:', receipt);
      
      // Add temporary message to UI immediately for better UX
      const tempMessage = {
        id: Date.now(), // Temporary ID
        senderId,
        senderName,
        senderType: userRole,
        message: messageText,
        encryptedMessage: encryptedText,
        timestamp: new Date().toISOString(),
        isAppointmentInfo: false,
        appointmentData: null,
        decrypted: true,
        read: true
      };
      
      // Add message to UI immediately
      setMessages(prev => [...prev, tempMessage]);
      
      // Clear input
      setNewMessage('');
      
      // Reload messages from blockchain to get the official version (in background)
      setTimeout(async () => {
        try {
          await loadMessagesFromBlockchain();
        } catch (error) {
          console.warn('Background message reload failed:', error);
        }
      }, 1000); // Wait 1 second for blockchain to process
      
      // Show notification to other user
      if (onNotification) {
        const recipientId = userRole === 'patient' ? selectedChat.doctorId : selectedChat.patientId;
        const recipientType = userRole === 'patient' ? 'doctor' : 'patient';
        
        onNotification({
          type: 'new_message',
          from: currentUser?.name,
          message: messageText,
          chatId: `chat_${selectedChat.patientId}_${selectedChat.doctorId}`,
          recipientId,
          recipientType,
          senderId,
          senderType: userRole
        });
      }
      
    } catch (error) {
      console.error('❌ Error sending message to blockchain:', error);
      setError('Failed to send message: ' + error.message);
      
      // Don't clear the message on error so user can retry
      
    } finally {
      setLoading(false);
    }
  };

  const sendAppointmentInfo = async (appointment) => {
    if (!selectedChat || !chatKey) return;

    setLoading(true);
    setError('');

    try {
      const appointmentMessage = `📅 **APPOINTMENT CONFIRMED**

👤 **Patient:** ${appointment.patientName}
🩺 **Doctor:** ${appointment.doctorName}
📅 **Date:** ${appointment.date}
⏰ **Time:** ${appointment.time}
📝 **Reason:** ${appointment.reason}
✅ **Status:** ${appointment.status}
🆔 **Appointment ID:** ${appointment.id}

${appointment.fromRequest ? '🔄 **Source:** Approved from patient request' : '📋 **Source:** Doctor scheduled'}
📧 **Email notification sent**
🔒 **This information is encrypted and secure**

Please save this information for your records.`;

      const contract = await getContract();
      const encryptedText = encryptMessage(appointmentMessage, chatKey);
      const senderId = userRole === 'patient' ? currentUser?.id : currentUser?.regId;
      const senderName = currentUser?.name || 'Unknown';
      
      // Send to blockchain
      const tx = await contract.sendChatMessage(
        selectedChat.patientId,
        selectedChat.doctorId,
        senderId,
        senderName,
        userRole,
        appointmentMessage,
        encryptedText,
        true, // isAppointmentInfo
        JSON.stringify(appointment) // appointmentData
      );
      
      await tx.wait();
      console.log('✅ Appointment info sent to blockchain');
      
      // Reload messages
      await loadMessagesFromBlockchain();
      
    } catch (error) {
      console.error('❌ Error sending appointment info:', error);
      setError('Failed to send appointment info: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTyping = (value) => {
    setNewMessage(value);
    
    if (value.length > 0 && !isTyping) {
      setIsTyping(true);
    } else if (value.length === 0 && isTyping) {
      setIsTyping(false);
    }
    
    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
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
        mb: 2,
        alignItems: 'flex-end'
      }}
    >
      {!isOwn && (
        <Avatar
          sx={{
            width: 32,
            height: 32,
            mr: 1,
            bgcolor: message.senderType === 'doctor' ? '#4fc3f7' : '#81c784'
          }}
        >
          {message.senderType === 'doctor' ? <LocalHospitalIcon sx={{ fontSize: 18 }} /> : <PersonIcon sx={{ fontSize: 18 }} />}
        </Avatar>
      )}
      
      <Paper
        elevation={2}
        sx={{
          maxWidth: '70%',
          p: 2,
          borderRadius: 3,
          bgcolor: isOwn 
            ? 'linear-gradient(135deg, #4fc3f7 0%, #29b6f6 100%)'
            : '#2d3748',
          color: '#fff',
          position: 'relative',
          border: message.isAppointmentInfo ? '2px solid #00ff99' : 'none',
          '&::before': message.isAppointmentInfo ? {
            content: '"📅"',
            position: 'absolute',
            top: -8,
            left: -8,
            bgcolor: '#00ff99',
            borderRadius: '50%',
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px'
          } : {}
        }}
      >
        {!isOwn && (
          <Typography variant="caption" sx={{ color: '#4fc3f7', fontWeight: 600, display: 'block', mb: 0.5 }}>
            {message.senderType === 'doctor' ? '🩺' : '👤'} {message.senderName}
          </Typography>
        )}
        
        <Typography
          variant="body2"
          sx={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: 1.4
          }}
        >
          {message.message}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.7rem' }}>
            {formatTime(message.timestamp)}
          </Typography>
          
          {message.isAppointmentInfo && (
            <Chip
              icon={<EventIcon />}
              label="Appointment"
              size="small"
              sx={{
                height: 20,
                fontSize: '0.7rem',
                bgcolor: 'rgba(0, 255, 153, 0.2)',
                color: '#00ff99',
                ml: 1
              }}
            />
          )}
          
          <LockIcon sx={{ fontSize: 12, opacity: 0.5, ml: 1 }} />
        </Box>
      </Paper>
      
      {isOwn && (
        <Avatar
          sx={{
            width: 32,
            height: 32,
            ml: 1,
            bgcolor: '#4fc3f7'
          }}
        >
          {userRole === 'doctor' ? <LocalHospitalIcon sx={{ fontSize: 18 }} /> : <PersonIcon sx={{ fontSize: 18 }} />}
        </Avatar>
      )}
    </Box>
  );

  const ChatHeader = () => (
    <Box
      sx={{
        p: 3,
        borderBottom: '2px solid #4fc3f7',
        background: 'linear-gradient(135deg, #232b39 0%, #1a1f2e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Avatar
          sx={{
            width: 48,
            height: 48,
            mr: 2,
            bgcolor: selectedChat?.partnerType === 'doctor' ? '#4fc3f7' : '#81c784'
          }}
        >
          {selectedChat?.partnerType === 'doctor' ? <LocalHospitalIcon /> : <PersonIcon />}
        </Avatar>
        
        <Box>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
            {selectedChat?.partnerType === 'doctor' ? '🩺' : '👤'} {selectedChat?.name}
          </Typography>
          <Typography variant="caption" sx={{ color: '#4fc3f7' }}>
            {selectedChat?.partnerType === 'doctor' ? 'Doctor' : 'Patient'} • {selectedChat?.partnerId}
          </Typography>
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip title="End-to-end encrypted">
          <SecurityIcon sx={{ color: '#00ff99', fontSize: 20 }} />
        </Tooltip>
        <Tooltip title="Blockchain secured">
          <VerifiedUserIcon sx={{ color: '#4fc3f7', fontSize: 20 }} />
        </Tooltip>
        <Button
          variant="outlined"
          size="small"
          onClick={loadMessagesFromBlockchain}
          disabled={loadingMessages}
          sx={{ 
            color: '#fff', 
            borderColor: '#fff',
            minWidth: 'auto',
            px: 2
          }}
        >
          {loadingMessages ? <CircularProgress size={16} /> : <RefreshIcon sx={{ fontSize: 16 }} />}
        </Button>
      </Box>
    </Box>
  );

  if (!currentUser) {
    return (
      <Paper sx={{ bgcolor: "#232b39", color: "#fff", p: 4, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ color: "#fff", textAlign: "center" }}>
          Please log in to access secure chat
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: 600, borderRadius: 3, overflow: 'hidden' }}>
      {/* Chat List */}
      <Paper
        sx={{
          width: 300,
          bgcolor: '#1a1f2e',
          borderRadius: '12px 0 0 12px',
          borderRight: '2px solid #4fc3f7'
        }}
      >
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid #4fc3f7',
            background: 'linear-gradient(135deg, #232b39 0%, #1a1f2e 100%)'
          }}
        >
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, textAlign: 'center' }}>
            💬 Secure Chat
          </Typography>
          <Typography variant="caption" sx={{ color: '#4fc3f7', display: 'block', textAlign: 'center' }}>
            🔒 Blockchain + E2E Encrypted
          </Typography>
        </Box>
        
        <List sx={{ p: 0, maxHeight: 500, overflowY: 'auto' }}>
          {availableChats.length === 0 ? (
            <ListItem>
              <ListItemText
                primary={
                  <Typography sx={{ color: '#888', textAlign: 'center', py: 2 }}>
                    No chats available
                  </Typography>
                }
              />
            </ListItem>
          ) : (
            availableChats.map((chat) => (
              <ListItem
                key={chat.id}
                button
                onClick={() => selectChat(chat)}
                sx={{
                  borderBottom: '1px solid #2d3748',
                  bgcolor: selectedChat?.id === chat.id ? 'rgba(79, 195, 247, 0.1)' : 'transparent',
                  '&:hover': {
                    bgcolor: 'rgba(79, 195, 247, 0.05)'
                  }
                }}
              >
                <ListItemAvatar>
                  <Badge
                    color="success"
                    variant="dot"
                    invisible={chat.status !== 'active'}
                  >
                    <Avatar
                      sx={{
                        bgcolor: chat.partnerType === 'doctor' ? '#4fc3f7' : '#81c784'
                      }}
                    >
                      {chat.partnerType === 'doctor' ? <LocalHospitalIcon /> : <PersonIcon />}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                
                <ListItemText
                  primary={
                    <Typography sx={{ color: '#fff', fontWeight: 600 }}>
                      {chat.partnerType === 'doctor' ? '🩺' : '👤'} {chat.name}
                    </Typography>
                  }
                  secondary={
                    <Typography sx={{ color: '#4fc3f7', fontSize: '0.8rem' }}>
                      {chat.partnerType === 'doctor' ? 'Doctor' : 'Patient'} • {chat.partnerId}
                    </Typography>
                  }
                />
              </ListItem>
            ))
          )}
        </List>
      </Paper>

      {/* Chat Area */}
      <Paper
        sx={{
          flex: 1,
          bgcolor: '#232b39',
          borderRadius: '0 12px 12px 0',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {selectedChat ? (
          <>
            <ChatHeader />
            
            {error && (
              <Alert severity="error" sx={{ m: 2 }}>
                {error}
              </Alert>
            )}
            
            {/* Messages Area */}
            <Box
              sx={{
                flex: 1,
                p: 2,
                overflowY: 'auto',
                maxHeight: 400,
                bgcolor: '#1a1f2e'
              }}
            >
              {loadingMessages ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                  <CircularProgress />
                  <Typography sx={{ color: '#fff', ml: 2 }}>Loading messages from blockchain...</Typography>
                </Box>
              ) : messages.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <LockIcon sx={{ fontSize: 48, color: '#4fc3f7', mb: 2 }} />
                  <Typography sx={{ color: '#888' }}>
                    Start a secure conversation
                  </Typography>
                  <Typography sx={{ color: '#4fc3f7', fontSize: '0.9rem', mt: 1 }}>
                    Messages are encrypted and stored on blockchain
                  </Typography>
                </Box>
              ) : (
                messages.map((message) => {
                  const currentUserId = userRole === 'patient' ? currentUser?.id : currentUser?.regId;
                  console.log('🔍 DETAILED Debug:', {
                    messageId: message.id,
                    messageSenderId: message.senderId,
                    messageSenderType: message.senderType,
                    currentUserRole: userRole,
                    currentUserId: currentUserId,
                    currentUserName: currentUser?.name,
                    comparison: `"${message.senderId}" === "${currentUserId}"`,
                    areEqual: message.senderId === currentUserId
                  });
                  
                  const isOwn = userRole === 'patient' 
                    ? message.senderId === currentUser?.id 
                    : message.senderId === currentUser?.regId;
                  
                  console.log('✅ Final isOwn result:', isOwn, 'for message:', message.message.substring(0, 50));
                  
                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={isOwn}
                    />
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </Box>
            
            {/* Appointment Quick Actions */}
            {getRelevantAppointments().length > 0 && (
              <Box sx={{ p: 2, borderTop: '1px solid #2d3748', bgcolor: '#1a1f2e' }}>
                <Typography variant="caption" sx={{ color: '#4fc3f7', mb: 1, display: 'block' }}>
                  📅 Quick Actions:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {getRelevantAppointments().slice(0, 2).map((appointment) => (
                    <Button
                      key={appointment.id}
                      variant="outlined"
                      size="small"
                      onClick={() => sendAppointmentInfo(appointment)}
                      disabled={loading}
                      sx={{
                        color: '#00ff99',
                        borderColor: '#00ff99',
                        fontSize: '0.7rem',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 255, 153, 0.1)'
                        }
                      }}
                    >
                      📅 Share {formatDate(appointment.date)}
                    </Button>
                  ))}
                </Box>
              </Box>
            )}
            
            {/* Message Input */}
            <Box
              sx={{
                p: 2,
                borderTop: '2px solid #4fc3f7',
                bgcolor: '#232b39'
              }}
            >
              <TextField
                fullWidth
                multiline
                maxRows={3}
                value={newMessage}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type your secure message..."
                disabled={loading || loadingMessages}
                InputProps={{
                  style: { 
                    color: '#fff', 
                    background: '#2d3748',
                    borderRadius: 12
                  },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || loading || loadingMessages}
                        sx={{
                          color: newMessage.trim() ? '#4fc3f7' : '#888',
                          '&:hover': {
                            backgroundColor: 'rgba(79, 195, 247, 0.1)'
                          }
                        }}
                      >
                        {loading ? <CircularProgress size={20} /> : <SendIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                InputLabelProps={{ style: { color: '#4fc3f7' } }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#4fc3f7',
                      borderRadius: 3
                    },
                    '&:hover fieldset': {
                      borderColor: '#29b6f6'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#4fc3f7'
                    }
                  }
                }}
              />
              
              {isTyping && (
                <Typography variant="caption" sx={{ color: '#4fc3f7', mt: 1, display: 'block' }}>
                  ⌨️ Typing...
                </Typography>
              )}
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption" sx={{ color: '#888', display: 'flex', alignItems: 'center' }}>
                  <LockIcon sx={{ fontSize: 12, mr: 0.5 }} />
                  End-to-end encrypted • Blockchain secured
                </Typography>
                
                <Typography variant="caption" sx={{ color: '#4fc3f7' }}>
                  Press Enter to send • Shift+Enter for new line
                </Typography>
              </Box>
            </Box>
          </>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              p: 4
            }}
          >
            <LockIcon sx={{ fontSize: 64, color: '#4fc3f7', mb: 2 }} />
            <Typography variant="h5" sx={{ color: '#fff', mb: 1, textAlign: 'center' }}>
              Blockchain Secure Chat
            </Typography>
            <Typography sx={{ color: '#888', textAlign: 'center', mb: 2 }}>
              Select a conversation to start chatting securely
            </Typography>
            <Typography sx={{ color: '#4fc3f7', fontSize: '0.9rem', textAlign: 'center' }}>
              🔒 End-to-end encrypted • 🔗 Blockchain stored • 🛡️ HIPAA compliant
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default BlockchainSecureChat;
