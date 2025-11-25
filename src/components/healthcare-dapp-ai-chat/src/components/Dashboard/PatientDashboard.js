import React from 'react';
import { Paper, Typography, Container } from '@mui/material';

const PatientDashboard = ({ patientData }) => {
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
          Patient Dashboard
        </Typography>
        <Typography><b>ID:</b> {patientData.id}</Typography>
        <Typography><b>Name:</b> {patientData.name}</Typography>
        <Typography><b>Disease:</b> {patientData.disease}</Typography>
        <Typography><b>DOB:</b> {patientData.dob}</Typography>
        <Typography><b>Mobile:</b> {patientData.mobile}</Typography>
        <Typography><b>Email:</b> {patientData.email}</Typography>
        <Typography><b>SBP:</b> {patientData.sbp}</Typography>
        <Typography><b>Sugar:</b> {patientData.sugar}</Typography>
      </Paper>
    </Container>
  );
};

export default PatientDashboard;