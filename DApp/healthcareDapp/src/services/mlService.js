class MLService {
  constructor() {
    this.apiUrl = 'http://localhost:5000';
  }

  async predictHealthRisk(patientData) {
    try {
      console.log("🤖 Sending patient data for ML risk prediction...");
      
      const mlData = {
        age: this.calculateAge(patientData.dob),
        sbp: this.extractSystolic(patientData.sbp),
        sugar: this.extractBloodSugar(patientData.sugar),
        disease: patientData.disease,
        patient_id: patientData.id,
        name: patientData.name,
        gender: patientData.gender || 'Male',
        mobile: patientData.mobile,
        email: patientData.email,
        dob: patientData.dob,
        bmi: patientData.bmi || 25.0,
        hba1c: patientData.hba1c || 5.5,
        smoking_history: patientData.smoking_history || 'never'
      };

      console.log("📊 ML Input Data:", mlData);

      const response = await fetch(`${this.apiUrl}/predict-risk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mlData)
      });

      if (!response.ok) {
        throw new Error(`ML API Error: ${response.status}`);
      }

      const result = await response.json();
      
      console.log("🎯 ML Prediction Result:", result);
      
      return {
        riskLevel: result.risk_level,
        riskScore: result.risk_score,
        riskScorePercentage: Math.round(result.risk_score * 100),
        recommendations: result.recommendations || [],
        factors: result.risk_factors || [],
        confidence: Math.round((result.confidence || 0) * 100),
        mlModelVersion: result.model_version,
        featuresUsed: result.features_used,
        timestamp: result.timestamp
      };

    } catch (error) {
      console.error("ML Prediction Error:", error);
      console.log("🔄 Falling back to local risk assessment...");
      return this.fallbackRiskAssessment(patientData);
    }
  }

  calculateAge(dob) {
    if (!dob) return 30;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return Math.max(age, 18);
  }

  extractSystolic(sbp) {
    if (typeof sbp === 'number') return sbp;
    if (typeof sbp === 'string' && sbp.includes('/')) {
      return parseInt(sbp.split('/')[0]) || 120;
    }
    const match = String(sbp).match(/\d+/);
    return match ? parseInt(match[0]) : 120;
  }

  extractBloodSugar(sugar) {
    if (typeof sugar === 'number') return sugar;
    if (typeof sugar === 'string') {
      const cleaned = sugar.replace(/[^\d.]/g, '');
      return parseFloat(cleaned) || 100;
    }
    const match = String(sugar).match(/\d+/);
    return match ? parseInt(match[0]) : 100;
  }

  fallbackRiskAssessment(patientData) {
    console.log("⚠️ Using fallback risk assessment - ML API unavailable");
    
    const age = this.calculateAge(patientData.dob);
    const sbp = this.extractSystolic(patientData.sbp);
    const bloodSugar = this.extractBloodSugar(patientData.sugar);
    
    let riskScore = 0;
    const factors = [];
    
    // Age scoring
    if (age > 65) { 
      riskScore += 25; 
      factors.push("Advanced age"); 
    } else if (age > 50) { 
      riskScore += 15; 
      factors.push("Middle age"); 
    }
    
    // Blood pressure scoring (MORE AGGRESSIVE)
    if (sbp > 180) { 
      riskScore += 50; 
      factors.push("Severe hypertension"); 
    } else if (sbp > 140) { 
      riskScore += 35; // Increased from 25
      factors.push("High blood pressure"); 
    } else if (sbp > 130) { 
      riskScore += 20; 
      factors.push("Stage 1 hypertension"); 
    }
    
    // Blood sugar scoring (MORE AGGRESSIVE)
    if (bloodSugar > 200) { 
      riskScore += 50; 
      factors.push("Severe hyperglycemia"); 
    } else if (bloodSugar > 140) { 
      riskScore += 40; // Increased from 30
      factors.push("High blood glucose"); 
    } else if (bloodSugar > 126) { 
      riskScore += 25; 
      factors.push("Diabetic range glucose"); 
    }
    
    // Critical combination
    if (sbp > 140 && bloodSugar > 140) {
      riskScore += 30;
      factors.push("Multiple critical factors");
    }
    
    // Disease history
    const disease = patientData.disease?.toLowerCase() || '';
    if (disease.includes('diabetes')) { 
      riskScore += 30; 
      factors.push("Diabetes history"); 
    }
    if (disease.includes('heart')) { 
      riskScore += 25; 
      factors.push("Heart condition"); 
    }
    if (disease.includes('hypertension')) { 
      riskScore += 20; 
      factors.push("Hypertension history"); 
    }
    
    riskScore = Math.min(riskScore, 100);
    
    // FIXED: Lower thresholds for risk levels
    let riskLevel = 'LOW';
    if (riskScore >= 40) {  // Changed from 60
      riskLevel = 'HIGH';
    } else if (riskScore >= 20) {  // Changed from 40
      riskLevel = 'MEDIUM';
    }
    
    return {
      riskLevel,
      riskScore: riskScore / 100,
      riskScorePercentage: riskScore,
      recommendations: this.getRecommendations(riskLevel, { sbp, bloodSugar, age }),
      factors,
      confidence: 85,
      mlModelVersion: 'fallback-enhanced-v2.0',
      featuresUsed: {
        age: age,
        sbp: sbp,
        blood_glucose: bloodSugar,
        fallback_mode: true
      },
      timestamp: new Date().toISOString()
    };
  }

  getRecommendations(riskLevel, vitals = {}) {
    const recommendations = [];
    
    if (riskLevel === 'HIGH') {
      recommendations.push("🚨 Consult your doctor immediately");
      recommendations.push("📊 Monitor blood glucose daily");
      recommendations.push("💊 Review current medications");
      recommendations.push("🏃 Start supervised exercise program");
      
      if (vitals.sbp > 160) {
        recommendations.push("🔴 Emergency BP management needed");
      }
      if (vitals.bloodSugar > 180) {
        recommendations.push("🍯 Strict carbohydrate restriction");
      }
      
    } else if (riskLevel === 'MEDIUM') {
      recommendations.push("⚠️ Schedule checkup within 2 weeks");
      recommendations.push("📈 Monitor health metrics weekly");
      recommendations.push("🥗 Follow diabetic diet plan");
      recommendations.push("💪 Increase physical activity");
      
      if (vitals.sbp > 130) {
        recommendations.push("📊 Daily BP monitoring");
      }
      if (vitals.bloodSugar > 126) {
        recommendations.push("🍎 Reduce sugar intake");
      }
      
    } else {
      recommendations.push("✅ Continue healthy lifestyle");
      recommendations.push("📅 Annual health checkups");
      recommendations.push("🥗 Maintain balanced diet");
      recommendations.push("🏃 Regular exercise routine");
      recommendations.push("💧 Stay hydrated");
    }
    
    return recommendations.slice(0, 6);
  }
}

export default MLService;