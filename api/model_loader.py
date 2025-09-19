import torch
import pickle
import json
import os
import logging
import numpy as np
from datetime import datetime
from sklearn.preprocessing import StandardScaler, LabelEncoder

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AdvancedHealthcareNet(torch.nn.Module):
    """Enhanced Neural Network with advanced architecture"""
    def __init__(self, input_size, hidden_sizes=[128, 64, 32], dropout_rate=0.3):
        super(AdvancedHealthcareNet, self).__init__()
        
        layers = []
        prev_size = input_size
        
        for i, hidden_size in enumerate(hidden_sizes):
            # Linear layer
            layers.append(torch.nn.Linear(prev_size, hidden_size))
            # Batch normalization for better training stability
            layers.append(torch.nn.BatchNorm1d(hidden_size))
            # Advanced activation function
            layers.append(torch.nn.LeakyReLU(0.1))
            # Dropout for regularization
            layers.append(torch.nn.Dropout(dropout_rate))
            prev_size = hidden_size
        
        # Output layer
        layers.append(torch.nn.Linear(prev_size, 1))
        layers.append(torch.nn.Sigmoid())
        
        self.network = torch.nn.Sequential(*layers)
    
    def forward(self, x):
        return self.network(x)

class ModelLoader:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.encoders = None
        self.model_info = None
        self.feature_names = None
        
    def load_enhanced_model(self):
        """Load the enhanced model and all artifacts"""
        try:
            logger.info("🔄 Loading enhanced model artifacts...")
            
            # Check if enhanced model exists
            enhanced_model_path = 'models/enhanced_model.pth'
            enhanced_info_path = 'models/enhanced_model_info.json'
            
            if os.path.exists(enhanced_model_path) and os.path.exists(enhanced_info_path):
                return self._load_enhanced_artifacts()
            else:
                # Fallback to regular model
                return self._load_regular_artifacts()
                
        except Exception as e:
            logger.error(f"❌ Failed to load model: {str(e)}")
            raise

    def _load_enhanced_artifacts(self):
        """Load enhanced model artifacts"""
        logger.info("📚 Loading enhanced model artifacts...")
        
        # Load model info first
        with open('models/enhanced_model_info.json', 'r') as f:
            self.model_info = json.load(f)
        
        # Load preprocessors
        with open('models/scaler.pkl', 'rb') as f:
            self.scaler = pickle.load(f)
            
        with open('models/encoders.pkl', 'rb') as f:
            self.encoders = pickle.load(f)
        
        # Initialize model with correct architecture
        input_size = self.model_info['input_features']
        hidden_sizes = self.model_info['hyperparameters']['hidden_layers']
        dropout_rate = self.model_info['hyperparameters']['dropout_rate']
        
        self.model = AdvancedHealthcareNet(
            input_size=input_size,
            hidden_sizes=hidden_sizes,
            dropout_rate=dropout_rate
        )
        
        # Load model weights
        self.model.load_state_dict(torch.load('models/enhanced_model.pth', map_location='cpu'))
        self.model.eval()
        
        self.feature_names = self.model_info['feature_names']
        
        logger.info(f"✅ Enhanced model loaded successfully!")
        logger.info(f"📊 Model efficiency: {self.model_info['efficiency_percentage']:.2f}%")
        logger.info(f"🏗️ Architecture: {self.model_info['architecture']}")
        
        return True

    def _load_regular_artifacts(self):
        """Fallback to load regular model artifacts"""
        logger.info("📚 Loading regular model artifacts...")
        
        # Load model info
        with open('models/model_info.json', 'r') as f:
            self.model_info = json.load(f)
        
        # Load preprocessors
        with open('models/scaler.pkl', 'rb') as f:
            self.scaler = pickle.load(f)
            
        with open('models/encoders.pkl', 'rb') as f:
            self.encoders = pickle.load(f)
        
        # Initialize regular model
        self.model = AdvancedHealthcareNet(input_size=8)  # Default architecture
        self.model.load_state_dict(torch.load('models/best_model.pth', map_location='cpu'))
        self.model.eval()
        
        self.feature_names = ['gender', 'age', 'hypertension', 'heart_disease', 
                             'smoking_history', 'bmi', 'HbA1c_level', 'blood_glucose_level']
        
        logger.info("✅ Regular model loaded successfully!")
        return True

    def preprocess_patient_data(self, patient_data):
        """Preprocess patient data for prediction"""
        try:
            # Extract features from patient data
            features = {}
            
            # Extract systolic BP from SBP field
            sbp_raw = patient_data.get('sbp', '120/80')
            if isinstance(sbp_raw, str) and '/' in sbp_raw:
                systolic_bp = int(sbp_raw.split('/')[0])
            else:
                systolic_bp = int(sbp_raw) if sbp_raw else 120
            
            # Extract blood sugar
            sugar_raw = patient_data.get('sugar', '100')
            if isinstance(sugar_raw, str):
                blood_glucose = float(sugar_raw.replace('mg/dL', '').strip())
            else:
                blood_glucose = float(sugar_raw) if sugar_raw else 100
            
            # Calculate age from DOB or use direct age
            age = self._calculate_age(patient_data.get('dob'), patient_data.get('age', 30))
            
            # Basic features
            features['gender'] = 1 if patient_data.get('gender', 'Male').lower() == 'male' else 0
            features['age'] = age
            features['systolic_bp'] = systolic_bp  # Store for risk analysis
            features['hypertension'] = 1 if systolic_bp > 140 or 'hypertension' in str(patient_data.get('disease', '')).lower() else 0
            features['heart_disease'] = 1 if 'heart' in str(patient_data.get('disease', '')).lower() else 0
            features['smoking_history'] = self._encode_smoking_history(patient_data.get('smoking_history', 'never'))
            features['bmi'] = float(patient_data.get('bmi', 25.0))
            features['HbA1c_level'] = float(patient_data.get('hba1c', 5.5))
            features['blood_glucose_level'] = blood_glucose
            
            # Enhanced features (if available)
            if 'age_bmi_interaction' in self.feature_names:
                features['age_bmi_interaction'] = features['age'] * features['bmi']
            if 'glucose_hba1c_ratio' in self.feature_names:
                features['glucose_hba1c_ratio'] = features['blood_glucose_level'] / max(features['HbA1c_level'], 1)
            if 'health_risk_score' in self.feature_names:
                features['health_risk_score'] = (features['hypertension'] + features['heart_disease']) * features['age'] / 100
            
            # Convert to array in correct order
            feature_array = np.array([features[name] for name in self.feature_names]).reshape(1, -1)
            
            # Scale features
            scaled_features = self.scaler.transform(feature_array)
            
            return torch.FloatTensor(scaled_features), features
            
        except Exception as e:
            logger.error(f"❌ Preprocessing failed: {str(e)}")
            raise

    def _calculate_age(self, dob, default_age):
        """Calculate age from date of birth"""
        if dob:
            try:
                birth_date = datetime.strptime(dob, '%Y-%m-%d')
                today = datetime.today()
                age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
                return age
            except:
                pass
        return int(default_age) if default_age else 30

    def _encode_smoking_history(self, smoking_status):
        """Encode smoking history"""
        smoking_map = {
            'never': 0,
            'former': 1, 
            'current': 2,
            'not_current': 3
        }
        return smoking_map.get(str(smoking_status).lower(), 0)

    def predict_risk(self, patient_data):
        """Make risk prediction with enhanced sensitivity"""
        try:
            # Preprocess data
            features_tensor, raw_features = self.preprocess_patient_data(patient_data)
            
            # Make prediction
            with torch.no_grad():
                prediction = self.model(features_tensor)
                risk_score = float(prediction.item())
            
            # FIXED: More sensitive risk level determination
            if risk_score >= 0.3:  # Changed from 0.5 to 0.3
                risk_level = 'HIGH'
            elif risk_score >= 0.15:  # Changed from 0.3 to 0.15
                risk_level = 'MEDIUM'
            else:
                risk_level = 'LOW'
            
            # Additional risk boosting based on critical values
            risk_score = self._apply_risk_boosting(risk_score, raw_features)
            
            # Re-evaluate risk level after boosting
            if risk_score >= 0.4:
                risk_level = 'HIGH'
            elif risk_score >= 0.2:
                risk_level = 'MEDIUM'
            
            # Generate recommendations and risk factors
            recommendations = self._generate_recommendations(risk_level, raw_features)
            risk_factors = self._identify_risk_factors(raw_features)
            
            # Calculate percentage score
            risk_score_percentage = min(max(risk_score * 100, 0), 100)
            
            result = {
                'risk_score': risk_score,
                'risk_level': risk_level,
                'riskScorePercentage': risk_score_percentage,
                'confidence': min(95, max(70, risk_score * 100 + 15)),
                'recommendations': recommendations,
                'risk_factors': risk_factors,
                'model_version': self.model_info.get('model_type', 'Enhanced Healthcare NN v2.0'),
                'features_used': raw_features,
                'timestamp': datetime.now().isoformat()
            }
            
            logger.info(f"🎯 Prediction made: {risk_level} risk ({risk_score:.3f}, {risk_score_percentage:.1f}%)")
            return result
            
        except Exception as e:
            logger.error(f"❌ Prediction failed: {str(e)}")
            raise

    def _apply_risk_boosting(self, base_score, features):
        """Apply risk boosting for critical health indicators"""
        boosted_score = base_score
        
        # Critical blood pressure boosting
        sbp = features.get('systolic_bp', 120)
        if sbp > 180:
            boosted_score += 0.3  # Severe hypertension
        elif sbp > 160:
            boosted_score += 0.2  # Stage 2 hypertension
        elif sbp > 140:
            boosted_score += 0.1  # Stage 1 hypertension
        
        # Critical blood glucose boosting
        glucose = features.get('blood_glucose_level', 100)
        if glucose > 200:
            boosted_score += 0.3  # Severe hyperglycemia
        elif glucose > 140:
            boosted_score += 0.2  # High glucose
        elif glucose > 126:
            boosted_score += 0.1  # Diabetic range
        
        # Age factor boosting
        age = features.get('age', 30)
        if age > 65:
            boosted_score += 0.1
        elif age > 50:
            boosted_score += 0.05
        
        # Combination risk boosting
        if sbp > 140 and glucose > 140:
            boosted_score += 0.15  # Multiple critical factors
        
        return min(boosted_score, 1.0)  # Cap at 1.0

    def _generate_recommendations(self, risk_level, features):
        """Generate health recommendations based on risk level and specific conditions"""
        recommendations = []
        
        # Base recommendations by risk level
        if risk_level == 'HIGH':
            recommendations.extend([
                "🚨 Seek immediate medical attention",
                "📊 Monitor vital signs daily",
                "💊 Review medications with doctor",
                "🏥 Consider emergency consultation"
            ])
        elif risk_level == 'MEDIUM':
            recommendations.extend([
                "⚠️ Schedule doctor appointment within 1 week",
                "📈 Monitor health metrics twice weekly",
                "🥗 Follow strict dietary guidelines",
                "💪 Begin supervised exercise program"
            ])
        else:
            recommendations.extend([
                "✅ Continue current healthy practices",
                "📅 Schedule routine annual checkup",
                "🥗 Maintain balanced nutrition",
                "🏃 Regular moderate exercise"
            ])
        
        # Specific condition-based recommendations
        sbp = features.get('systolic_bp', 120)
        glucose = features.get('blood_glucose_level', 100)
        bmi = features.get('bmi', 25)
        age = features.get('age', 30)
        
        if sbp > 140:
            recommendations.append("🩸 Blood pressure management critical")
        if glucose > 140:
            recommendations.append("🍯 Strict blood sugar control needed")
        if bmi > 30:
            recommendations.append("⚖️ Weight management program recommended")
        if age > 60 and (sbp > 130 or glucose > 120):
            recommendations.append("👴 Age-related risk monitoring essential")
        
        return recommendations[:6]  # Limit to 6 recommendations

    def _identify_risk_factors(self, features):
        """Identify specific risk factors with enhanced sensitivity"""
        risk_factors = []
        
        # Age factors (lowered thresholds)
        age = features.get('age', 0)
        if age > 60:
            risk_factors.append("Advanced age (high risk)")
        elif age > 45:
            risk_factors.append("Middle age consideration")
        
        # BMI factors (lowered thresholds)
        bmi = features.get('bmi', 25)
        if bmi > 30:
            risk_factors.append("Obesity (BMI > 30)")
        elif bmi > 27:
            risk_factors.append("Overweight (BMI > 27)")
        elif bmi > 25:
            risk_factors.append("Above normal weight")
        
        # Blood glucose factors (lowered thresholds)
        glucose = features.get('blood_glucose_level', 100)
        if glucose > 200:
            risk_factors.append("Severe hyperglycemia")
        elif glucose > 140:
            risk_factors.append("High blood glucose")
        elif glucose > 126:
            risk_factors.append("Diabetic range glucose")
        elif glucose > 100:
            risk_factors.append("Elevated fasting glucose")
        
        # HbA1c factors (lowered thresholds)
        hba1c = features.get('HbA1c_level', 5.5)
        if hba1c > 7.0:
            risk_factors.append("Poor diabetes control")
        elif hba1c > 6.5:
            risk_factors.append("Diabetic HbA1c level")
        elif hba1c > 5.7:
            risk_factors.append("Pre-diabetic HbA1c")
        
        # Blood pressure factors (lowered thresholds)
        sbp = features.get('systolic_bp', 120)
        if sbp > 180:
            risk_factors.append("Severe hypertension crisis")
        elif sbp > 160:
            risk_factors.append("Stage 2 hypertension")
        elif sbp > 140:
            risk_factors.append("Stage 1 hypertension")
        elif sbp > 130:
            risk_factors.append("Elevated blood pressure")
        elif sbp > 120:
            risk_factors.append("Above normal blood pressure")
        
        # Medical history factors
        if features.get('hypertension', 0) == 1:
            risk_factors.append("Diagnosed hypertension")
        if features.get('heart_disease', 0) == 1:
            risk_factors.append("Heart disease history")
        
        # Smoking factors
        smoking = features.get('smoking_history', 0)
        if smoking == 2:
            risk_factors.append("Current smoker")
        elif smoking == 1:
            risk_factors.append("Former smoker")
        
        # Combination risks
        if sbp > 140 and glucose > 140:
            risk_factors.append("Multiple critical conditions")
        if age > 50 and bmi > 28:
            risk_factors.append("Age-obesity combination risk")
        
        return risk_factors

    def _extract_systolic_bp(self, features):
        """Extract systolic BP from patient data"""
        return features.get('systolic_bp', 120)

# Global model loader instance
model_loader = ModelLoader()

def load_model():
    """Load the model globally"""
    return model_loader.load_enhanced_model()

def get_model_info():
    """Get model information"""
    if model_loader.model_info:
        return model_loader.model_info
    return {"status": "Model not loaded"}

def predict_health_risk(patient_data):
    """Make health risk prediction"""
    try:
        return model_loader.predict_risk(patient_data)
    except Exception as e:
        logger.error(f"❌ Risk prediction failed: {str(e)}")
        # Return a fallback response
        return {
            'risk_score': 0.5,
            'risk_level': 'MEDIUM',
            'riskScorePercentage': 50,
            'confidence': 75,
            'recommendations': ['Consult healthcare provider', 'Monitor health regularly'],
            'risk_factors': ['Model prediction unavailable'],
            'model_version': 'Fallback Mode',
            'features_used': {},
            'timestamp': datetime.now().isoformat()
        }