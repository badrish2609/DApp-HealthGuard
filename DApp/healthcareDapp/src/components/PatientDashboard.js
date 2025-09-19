import React, { useState, useEffect } from 'react';
import { Card, ProgressBar, Badge, Alert, Row, Col } from 'react-bootstrap';
import MLService from '../services/mlService';

const RiskAssessment = ({ patientData, riskData, onRiskUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mlService] = useState(new MLService());

  useEffect(() => {
    // If no riskData provided as prop, calculate it
    if (patientData && !riskData && onRiskUpdate) {
      performAssessment();
    }
  }, [patientData, riskData]);

  const performAssessment = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log("🤖 RiskAssessment: Calculating ML risk...");
      const mlResults = await mlService.predictHealthRisk(patientData);
      console.log("📊 RiskAssessment: ML Results:", mlResults);
      
      if (onRiskUpdate) {
        onRiskUpdate(mlResults);
      }
    } catch (err) {
      console.error("❌ RiskAssessment: Error:", err);
      setError('ML risk assessment failed: ' + err.message);
      
      // Provide fallback assessment
      const fallbackResults = mlService.fallbackRiskAssessment(patientData);
      if (onRiskUpdate) {
        onRiskUpdate(fallbackResults);
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'HIGH': return 'danger';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'success';
      default: return 'secondary';
    }
  };

  const getProgressBarValue = (data) => {
    if (!data) return 0;
    
    if (data.riskScorePercentage !== undefined) {
      return Math.min(Math.max(data.riskScorePercentage, 0), 100);
    }
    
    if (data.riskScore !== undefined) {
      if (data.riskScore <= 1) {
        return Math.min(Math.max(data.riskScore * 100, 0), 100);
      }
      return Math.min(Math.max(data.riskScore, 0), 100);
    }
    
    return 0;
  };

  const getDisplayPercentage = (data) => {
    if (!data) return 0;
    
    if (data.riskScorePercentage !== undefined) {
      return Math.round(data.riskScorePercentage);
    }
    
    if (data.riskScore !== undefined) {
      if (data.riskScore <= 1) {
        return Math.round(data.riskScore * 100);
      }
      return Math.round(data.riskScore);
    }
    
    return 0;
  };

  if (!patientData) {
    return (
      <Alert variant="info" className="mb-3">
        <Alert.Heading>📊 ML Risk Assessment</Alert.Heading>
        No patient data available for risk calculation.
      </Alert>
    );
  }

  if (loading) {
    return (
      <Card className="mb-3">
        <Card.Header className="bg-primary text-white">
          <h6 className="mb-0">🧠 ML Risk Assessment</h6>
        </Card.Header>
        <Card.Body className="text-center py-4">
          <div className="spinner-border text-primary mb-2" role="status"></div>
          <p className="mb-0">Analyzing your health data with ML model...</p>
        </Card.Body>
      </Card>
    );
  }

  if (error && !riskData) {
    return (
      <Alert variant="danger" className="mb-3">
        <Alert.Heading>⚠️ ML Risk Assessment Error</Alert.Heading>
        {error}
      </Alert>
    );
  }

  if (!riskData) {
    return (
      <Alert variant="warning" className="mb-3">
        <Alert.Heading>⏳ ML Risk Assessment</Alert.Heading>
        Risk assessment is being calculated...
      </Alert>
    );
  }

  const progressValue = getProgressBarValue(riskData);
  const displayPercentage = getDisplayPercentage(riskData);

  return (
    <Card className="mb-3 shadow">
      <Card.Header className="bg-gradient-primary text-white">
        <Row className="align-items-center">
          <Col>
            <h6 className="mb-0">🧠 ML Risk Assessment Model</h6>
            <small>Machine Learning Health Risk Prediction</small>
          </Col>
          <Col xs="auto">
            <Badge bg={getRiskColor(riskData.riskLevel)} className="fs-6">
              {riskData.riskLevel} RISK
            </Badge>
          </Col>
        </Row>
      </Card.Header>
      
      <Card.Body>
        {/* Risk Score Progress Bar */}
        <div className="mb-3">
          <Row className="align-items-center">
            <Col>
              <label className="form-label mb-1">
                <strong>Risk Score: {displayPercentage}%</strong>
              </label>
              <ProgressBar 
                now={progressValue}
                variant={getRiskColor(riskData.riskLevel)}
                style={{ height: '25px' }}
                animated={true}
              />
            </Col>
          </Row>
        </div>

        {/* Risk Factors */}
        {riskData.factors && riskData.factors.length > 0 && (
          <div className="mb-3">
            <h6 className="text-primary">🚨 Risk Factors Identified:</h6>
            <div className="d-flex flex-wrap gap-1">
              {riskData.factors.map((factor, index) => (
                <Badge key={index} bg="outline-danger" className="mb-1">
                  {factor}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {riskData.recommendations && riskData.recommendations.length > 0 && (
          <div className="mb-3">
            <h6 className="text-primary">💡 ML Recommendations:</h6>
            <ul className="list-unstyled">
              {riskData.recommendations.slice(0, 4).map((rec, index) => (
                <li key={index} className="mb-1">
                  <small className="text-muted">• {rec}</small>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Model Info */}
        <Row className="mt-3 pt-2 border-top">
          <Col xs={6}>
            <small className="text-muted">
              <strong>Model:</strong> {riskData.mlModelVersion || 'ML-v2.0'}
            </small>
          </Col>
          <Col xs={6} className="text-end">
            <small className="text-muted">
              <strong>Confidence:</strong> {riskData.confidence || 85}%
            </small>
          </Col>
        </Row>

        {error && (
          <Alert variant="warning" className="mt-2 mb-0">
            <small>{error}</small>
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
};

export default RiskAssessment;