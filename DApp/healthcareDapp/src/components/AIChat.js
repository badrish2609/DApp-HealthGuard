import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Divider
} from '@mui/material';

const AIChat = ({ patientData }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Gemini API key
 ------------------------------------------------------------------------------

  // Healthcare context with patient data
  const healthcareContext = `
    You are a helpful healthcare AI assistant for a blockchain-based healthcare DApp. 
    You provide general health information, wellness tips, and answer basic medical questions.
    Always recommend consulting healthcare professionals for serious concerns.
    
    Patient Information:
    - Name: ${patientData?.name || 'Unknown'}
    - Disease/Condition: ${patientData?.disease || 'Not specified'}
    - Blood Pressure: ${patientData?.sbp || 'Not recorded'}
    - Blood Sugar: ${patientData?.sugar || 'Not recorded'}
    - Date of Birth: ${patientData?.dob || 'Not specified'}
    
    Keep responses concise, helpful, and patient-friendly.
  `;

  const predefinedQuestions = [
    "What should I know about my condition?",
    "Are there dietary recommendations for me?",
    "What are normal blood pressure ranges?",
    "How often should I monitor my health?",
    "What symptoms should I watch for?",
    "Tell me about medication reminders",
    "How can I improve my overall health?",
    "What lifestyle changes do you recommend?"
  ];

  const callGeminiAPI = async (question) => {
    const prompt = `${healthcareContext}\n\nPatient Question: ${question}\n\nPlease provide a helpful, accurate response:`;
    
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('Failed to get AI response. Please try again.');
    }
  };

  const handleSendMessage = async (question = input) => {
    if (!question.trim()) return;

    setLoading(true);
    setError('');

    try {
      const aiResponse = await callGeminiAPI(question);

      setMessages(prev => [
        ...prev,
        { type: 'user', content: question, timestamp: new Date() },
        { type: 'ai', content: aiResponse, timestamp: new Date() }
      ]);

      setInput('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Paper 
      elevation={3}
      sx={{ 
        p: 3, 
        bgcolor: '#232b39', 
        color: '#fff', 
        borderRadius: 3,
        maxWidth: '100%',
        margin: '20px 0'
      }}
    >
      <Typography variant="h5" gutterBottom sx={{ color: '#4fc3f7', fontWeight: 'bold' }}>
        🤖 AI Health Assistant
      </Typography>
      
      <Typography variant="body2" sx={{ mb: 2, color: '#aaa' }}>
        Ask me anything about your health, wellness tips, or general medical questions!
      </Typography>

      {/* Patient Info Summary */}
      {patientData && (
        <Box sx={{ mb: 2, p: 2, bgcolor: '#1a1f2e', borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ color: '#81c784', mb: 1 }}>
            Your Health Profile:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {patientData.disease && (
              <Chip label={`Condition: ${patientData.disease}`} size="small" sx={{ bgcolor: '#333', color: '#fff' }} />
            )}
            {patientData.sbp && (
              <Chip label={`BP: ${patientData.sbp}`} size="small" sx={{ bgcolor: '#333', color: '#fff' }} />
            )}
            {patientData.sugar && (
              <Chip label={`Sugar: ${patientData.sugar}`} size="small" sx={{ bgcolor: '#333', color: '#fff' }} />
            )}
          </Box>
        </Box>
      )}

      <Divider sx={{ borderColor: '#444', mb: 2 }} />

      {/* Predefined Questions */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, color: '#4fc3f7' }}>
          Quick Questions:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {predefinedQuestions.map((question, index) => (
            <Chip
              key={index}
              label={question}
              onClick={() => handleSendMessage(question)}
              sx={{ 
                fontSize: '0.75rem', 
                bgcolor: '#444', 
                color: '#fff',
                cursor: 'pointer',
                '&:hover': { bgcolor: '#555' }
              }}
              disabled={loading}
            />
          ))}
        </Box>
      </Box>

      {/* Chat Messages */}
      <Box sx={{ 
        height: '400px', 
        overflowY: 'auto', 
        mb: 2, 
        p: 2, 
        bgcolor: '#1a1f2e',
        borderRadius: 2,
        border: '1px solid #333'
      }}>
        {messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', color: '#aaa', mt: 8 }}>
            <Typography variant="h4">💬</Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              Welcome to your AI Health Assistant!
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Click a quick question above or type your own question below.
            </Typography>
          </Box>
        ) : (
          messages.map((msg, index) => (
            <Box key={index} sx={{ mb: 3 }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: msg.type === 'user' ? '#4fc3f7' : '#81c784',
                  fontWeight: 'bold',
                  display: 'block',
                  mb: 0.5
                }}
              >
                {msg.type === 'user' ? '👤 You:' : '🤖 AI Assistant:'} 
                <span style={{ color: '#666', marginLeft: '8px', fontSize: '0.7rem' }}>
                  {msg.timestamp.toLocaleTimeString()}
                </span>
              </Typography>
              <Paper 
                sx={{ 
                  p: 2, 
                  bgcolor: msg.type === 'user' ? '#2a3f5f' : '#2a4d3a',
                  color: '#fff',
                  borderRadius: 2
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </Typography>
              </Paper>
            </Box>
          ))
        )}
        
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', color: '#4fc3f7' }}>
            <CircularProgress size={20} sx={{ mr: 1, color: '#4fc3f7' }} />
            <Typography variant="body2">AI is thinking...</Typography>
          </Box>
        )}
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, bgcolor: '#d32f2f', color: '#fff' }}>
          {error}
        </Alert>
      )}

      {/* Input Field */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          placeholder="Ask about your health, medications, symptoms, or wellness tips..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          multiline
          maxRows={3}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: '#fff',
              bgcolor: '#1a1f2e',
              '& fieldset': { borderColor: '#444' },
              '&:hover fieldset': { borderColor: '#666' },
              '&.Mui-focused fieldset': { borderColor: '#4fc3f7' }
            },
            '& .MuiInputBase-input::placeholder': {
              color: '#888'
            }
          }}
        />
        <Button
          variant="contained"
          onClick={() => handleSendMessage()}
          disabled={loading || !input.trim()}
          sx={{ 
            minWidth: '100px',
            bgcolor: '#4fc3f7',
            '&:hover': { bgcolor: '#29b6f6' },
            '&:disabled': { bgcolor: '#333' }
          }}
        >
          {loading ? <CircularProgress size={20} /> : 'Send'}
        </Button>
      </Box>

      <Typography variant="caption" sx={{ color: '#666', mt: 1, display: 'block', textAlign: 'center' }}>
        ⚠️ This AI provides general information only. Always consult healthcare professionals for medical advice.
      </Typography>
    </Paper>
  );
};

export default AIChat;
