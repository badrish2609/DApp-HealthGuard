import React from 'react';
import PropTypes from 'prop-types';
import { Paper, Typography } from '@mui/material';

const ChatMessage = ({ message, sender }) => {
  return (
    <Paper
      sx={{
        padding: 2,
        margin: 1,
        backgroundColor: sender === 'user' ? '#e0f7fa' : '#ffe0b2',
        alignSelf: sender === 'user' ? 'flex-end' : 'flex-start',
        maxWidth: '80%',
      }}
    >
      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
        {sender}
      </Typography>
      <Typography variant="body2">{message}</Typography>
    </Paper>
  );
};

ChatMessage.propTypes = {
  message: PropTypes.string.isRequired,
  sender: PropTypes.oneOf(['user', 'ai']).isRequired,
};

export default ChatMessage;