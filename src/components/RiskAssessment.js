import React, { useState, useEffect } from 'react';
import { Paper, Typography, LinearProgress, Box, Chip, Alert } from '@mui/material';

const RiskAssessment = ({ patientData }) => {
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ML Model Risk Calculation Function
  const calculateMLRisk = (data) => {
    try {
      // Extract and normalize patient data
      const age = calculateAge(data.dob) || 30;
      const sbp = extractSystolic(data.sbp) || 120;
      const bloodSugar = extractBloodSugar(data.sugar) || 100;
      const bmi = parseFloat(data.bmi) || 25;
      
      // ML Model Risk Score Calculation (0-100)
      let riskScore = 0;
      let riskFactors = [];
      
      // Age factor (0-15 points)
      if (age >= 70) {
        riskScore += 15;
        riskFactors.push('Advanced age (70+)');
      } else if (age >= 60) {
        riskScore += 12;
        riskFactors.push('Senior age (60-69)');
      } else if (age >= 45) {
        riskScore += 8;
        riskFactors.push('Middle age (45-59)');
      } else if (age >= 35) {
        riskScore += 4;
        riskFactors.push('Adult age (35-44)');
      }
      
      // Blood Pressure factor (0-35 points)
      if (sbp >= 180) {
        riskScore += 35;
        riskFactors.push('Hypertensive Crisis');
      } else if (sbp >= 160) {
        riskScore += 28;
        riskFactors.push('Severe Hypertension');
      } else if (sbp >= 140) {
        riskScore += 20;
        riskFactors.push('High Blood Pressure');
      } else if (sbp >= 130) {
        riskScore += 12;
        riskFactors.push('Elevated Blood Pressure');
      } else if (sbp >= 120) {
        riskScore += 5;
        riskFactors.push('Normal-High BP');
      }
      
      // Blood Sugar factor (0-30 points)
      if (bloodSugar >= 250) {
        riskScore += 30;
        riskFactors.push('Severe Hyperglycemia');
      } else if (bloodSugar >= 200) {
        riskScore += 25;
        riskFactors.push('High Hyperglycemia');
      } else if (bloodSugar >= 140) {
        riskScore += 18;
        riskFactors.push('Diabetes Range');
      } else if (bloodSugar >= 126) {
        riskScore += 12;
        riskFactors.push('Pre-diabetes');
      } else if (bloodSugar >= 100) {
        riskScore += 6;
        riskFactors.push('Elevated Glucose');
      }
      
      // BMI factor (0-15 points)
      if (bmi >= 35) {
        riskScore += 15;
        riskFactors.push('Severe Obesity');
      } else if (bmi >= 30) {
        riskScore += 12;
        riskFactors.push('Obesity');
      } else if (bmi >= 25) {
        riskScore += 8;
        riskFactors.push('Overweight');
      } else if (bmi < 18.5) {
        riskScore += 5;
        riskFactors.push('Underweight');
      }
      
      // Combination risk multipliers
      if (sbp >= 140 && bloodSugar >= 140) {
        riskScore += 10;
        riskFactors.push('Multiple Critical Factors');
      }
      
      if (age >= 60 && (sbp >= 140 || bloodSugar >= 140)) {
        riskScore += 8;
        riskFactors.push('Age + Chronic Condition');
      }
      
      // Cap at 100
      riskScore = Math.min(riskScore, 100);
      
      // Determine risk level
      let riskLevel = 'LOW';
      let urgency = 'Routine monitoring';
      let recommendations = [];
      
      if (riskScore >= 70) {
        riskLevel = 'HIGH';
        urgency = 'Immediate medical attention required';
        recommendations = [
          'Seek immediate medical consultation',
          'Monitor vital signs closely',
          'Follow prescribed medications strictly',
          'Consider lifestyle modifications'
        ];
      } else if (riskScore >= 40) {
        riskLevel = 'MEDIUM';
        urgency = 'Schedule doctor visit soon';
        recommendations = [
          'Schedule appointment within 1-2 weeks',
          'Monitor blood pressure and sugar daily',
          'Maintain healthy diet and exercise',
          'Regular health check-ups'
        ];
      } else if (riskScore >= 20) {
        riskLevel = 'LOW-MEDIUM';
        urgency = 'Regular health monitoring';
        recommendations = [
          'Continue healthy lifestyle habits',
          'Regular monitoring of vitals',
          'Preventive health measures',
          'Annual health screenings'
        ];
      } else {
        recommendations = [
          'Maintain current healthy habits',
          'Regular exercise and balanced diet',
          'Preventive health screenings',
          'Stay hydrated and get adequate sleep'
        ];
      }
      
      return {
        riskScore,
        riskLevel,
        riskFactors: riskFactors.slice(0, 4), // Top 4 factors
        urgency,
        recommendations,
        patientAge: age,
        patientSBP: sbp,
        patientSugar: bloodSugar,
        patientBMI: bmi,
        category: getRiskCategory(riskLevel, riskScore)
      };
      
    } catch (error) {
      console.error('ML Risk calculation error:', error);
      return {
        riskScore: 0,
        riskLevel: 'UNKNOWN',
        riskFactors: ['Data processing error'],
        urgency: 'Please check your health data',
        recommendations: ['Unable to assess risk - verify your health information'],
        category: 'Error in assessment'
      };
    }
  };

  const getRiskCategory = (level, score) => {
    switch (level) {
      case 'HIGH':
        return score >= 85 ? 'Critical Risk - Emergency' : 'High Risk - Urgent Care';
      case 'MEDIUM':
        return score >= 55 ? 'Medium-High Risk' : 'Medium Risk';
      case 'LOW-MEDIUM':
        return 'Low-Medium Risk';
      case 'LOW':
        return 'Low Risk - Good Health';
      default:
        return 'Assessment Error';
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return null;
    try {
      const birth = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age > 0 ? age : null;
    } catch {
      return null;
    }
  };

  const extractSystolic = (sbp) => {
    if (!sbp) return null;
    const value = sbp.toString().split('/')[0];
    return parseInt(value) || null;
  };

  const extractBloodSugar = (sugar) => {
    if (!sugar) return null;
    const value = sugar.toString().replace(/[^\d.]/g, '');
    return parseFloat(value) || null;
  };

  const getRiskColor = (score) => {
    if (score < 20) return '#4caf50'; // Green
    if (score < 40) return '#2196f3'; // Blue
    if (score < 70) return '#ff9800'; // Orange
    return '#f44336'; // Red
  };

  const getRiskLevel = (score) => {
    if (score < 20) return 'LOW';
    if (score < 40) return 'LOW-MEDIUM';
    if (score < 70) return 'MEDIUM';
    return 'HIGH';
  };

  useEffect(() => {
    if (patientData) {
      setLoading(true);
      try {
        // Simulate ML model processing time
        setTimeout(() => {
          const mlResults = calculateMLRisk(patientData);
          setRiskData(mlResults);
          setLoading(false);
        }, 1500);
      } catch (err) {
        setError('Failed to calculate risk assessment');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [patientData]);

  if (!patientData) {
    return (
      <Paper sx={{ bgcolor: "#232b39", color: "#fff", p: 4, borderRadius: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ color: "#4fc3f7", fontWeight: "bold" }}>
          🤖 ML MODEL RISK PREDICTION
        </Typography>
        <Alert severity="info" sx={{ bgcolor: "#2d3748", color: "#fff" }}>
          No patient data available for risk calculation.
        </Alert>
      </Paper>
    );
  }

  if (loading) {
    return (
      <Paper sx={{ bgcolor: "#232b39", color: "#fff", p: 4, borderRadius: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ 
          color: "#4fc3f7", 
          fontWeight: "bold",
          textAlign: "center",
          fontSize: "1.3rem",
          textTransform: "uppercase",
          letterSpacing: 1,
          mb: 3
        }}>
          🤖 ML MODEL RISK PREDICTION
        </Typography>
        <Box sx={{ textAlign: "center", py: 2 }}>
          <Box sx={{ 
            width: 40, 
            height: 40, 
            border: '4px solid #4fc3f7', 
            borderTop: '4px solid transparent', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px auto',
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' }
            }
          }} />
          <Typography sx={{ color: "#fff" }}>
            Analyzing your health data with ML model...
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ bgcolor: "#232b39", color: "#fff", p: 4, borderRadius: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ color: "#4fc3f7", fontWeight: "bold" }}>
          🤖 ML MODEL RISK PREDICTION
        </Typography>
        <Alert severity="error" sx={{ bgcolor: "#2d3748", color: "#fff" }}>
          <Typography variant="h6">⚠️ ML Risk Assessment Error</Typography>
          {error}
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ bgcolor: "#232b39", color: "#fff", p: 4, borderRadius: 3, mb: 3, boxShadow: "0 4px 24px #0002" }}>
      {/* ML MODEL RISK PREDICTION HEADING */}
      <Typography variant="h6" gutterBottom sx={{ 
        color: "#4fc3f7", 
        fontWeight: "bold",
        mb: 3,
        textAlign: "center",
        fontSize: "1.3rem",
        textTransform: "uppercase",
        letterSpacing: 1
      }}>
        🤖 ML MODEL RISK PREDICTION
      </Typography>

      {/* Risk Score Progress Bar */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Health Risk Score: {riskData.riskScore}/100
          </Typography>
          <Chip 
            label={`${getRiskLevel(riskData.riskScore)} RISK`}
            sx={{ 
              bgcolor: getRiskColor(riskData.riskScore),
              color: '#fff',
              fontWeight: 'bold'
            }}
          />
        </Box>
        
        <LinearProgress
          variant="determinate"
          value={riskData.riskScore}
          sx={{
            height: 15,
            borderRadius: 8,
            bgcolor: '#2d3748',
            '& .MuiLinearProgress-bar': {
              bgcolor: getRiskColor(riskData.riskScore),
              borderRadius: 8,
            },
          }}
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption" sx={{ color: '#888' }}>0 (Low)</Typography>
          <Typography variant="caption" sx={{ color: '#888' }}>50 (Medium)</Typography>
          <Typography variant="caption" sx={{ color: '#888' }}>100 (High)</Typography>
        </Box>
        
        <Typography variant="body2" sx={{ mt: 1, color: '#ccc', textAlign: 'center' }}>
          {riskData.category}
        </Typography>
      </Box>

      {/* Health Data Summary */}
      <Box sx={{ mb: 3, p: 2, bgcolor: '#2d3748', borderRadius: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 2, color: '#4fc3f7' }}>
          📊 Health Data Analysis:
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1 }}>
          <Typography variant="body2" sx={{ color: '#ccc' }}>
            <strong>Age:</strong> {riskData.patientAge} years
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc' }}>
            <strong>Blood Pressure:</strong> {riskData.patientSBP} mmHg
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc' }}>
            <strong>Blood Sugar:</strong> {riskData.patientSugar} mg/dL
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc' }}>
            <strong>BMI:</strong> {riskData.patientBMI}
          </Typography>
        </Box>
      </Box>

      {/* Risk Factors */}
      {riskData.riskFactors && riskData.riskFactors.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2, color: '#ff9800' }}>
            ⚠️ Risk Factors Detected:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {riskData.riskFactors.map((factor, index) => (
              <Chip
                key={index}
                label={factor}
                size="small"
                sx={{ 
                  bgcolor: '#2d3748', 
                  color: '#ff9800',
                  border: '1px solid #ff9800'
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Recommendations */}
      {riskData.recommendations && riskData.recommendations.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2, color: '#4caf50' }}>
            💡 ML-Generated Health Recommendations:
          </Typography>
          <Box sx={{ pl: 2 }}>
            {riskData.recommendations.map((rec, index) => (
              <Typography key={index} variant="body2" sx={{ mb: 1, color: '#ccc' }}>
                • {rec}
              </Typography>
            ))}
          </Box>
        </Box>
      )}

      {/* Urgency Alert */}
      <Alert 
        severity={riskData.riskScore >= 70 ? 'error' : riskData.riskScore >= 40 ? 'warning' : 'info'}
        sx={{ 
          bgcolor: riskData.riskScore >= 70 ? '#2d1b1b' : riskData.riskScore >= 40 ? '#2d2619' : '#1b2d2d',
          color: '#fff',
          border: `1px solid ${getRiskColor(riskData.riskScore)}`,
          '& .MuiAlert-icon': {
            color: getRiskColor(riskData.riskScore)
          }
        }}
      >
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          {riskData.riskScore >= 70 ? '🚨' : riskData.riskScore >= 40 ? '⚠️' : '✅'} {riskData.urgency}
        </Typography>
      </Alert>

      <Typography variant="caption" sx={{ 
        display: 'block', 
        mt: 3, 
        textAlign: 'center', 
        color: '#666',
        fontStyle: 'italic'
      }}>
        * This ML-powered assessment analyzes your health data but should not replace professional medical advice
      </Typography>
    </Paper>
  );
};

export default RiskAssessment;