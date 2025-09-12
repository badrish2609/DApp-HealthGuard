import React from 'react';
import { Paper, Typography, Container } from '@mui/material';

const DoctorDashboard = () => {
  return (
    <Container sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
      <Paper
        sx={{
          bgcolor: '#232b39',
          color: '#fff',
          p: 4,
          borderRadius: 3,
          maxWidth: 600,
          width: '100%',
          boxShadow: '0 4px 24px #0002',
        }}
      >
        <Typography variant="h5" gutterBottom>
          Doctor Dashboard
        </Typography>
        <Typography variant="body1">
          Welcome to your dashboard. Here you can manage your patients, view analytics, and access health records.
        </Typography>
        {/* Additional doctor-specific information and analytics can be added here */}
      </Paper>
    </Container>
  );
};

export default DoctorDashboard;