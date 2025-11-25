from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os
import sys
import json
from datetime import datetime

# Add the current directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from model_loader import load_model, get_model_info, predict_health_risk

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        model_info = get_model_info()
        return jsonify({
            'status': 'healthy',
            'message': 'Healthcare DApp API is running',
            'model_loaded': 'model_type' in model_info,
            'model_info': model_info,
            'timestamp': datetime.now().isoformat()
        }), 200
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/predict-risk', methods=['POST'])
def predict_risk():
    """Main endpoint for health risk prediction"""
    try:
        # Get patient data from request
        patient_data = request.get_json()
        
        if not patient_data:
            return jsonify({'error': 'No patient data provided'}), 400
        
        logger.info(f"🔍 Received prediction request for patient: {patient_data.get('name', 'Unknown')}")
        
        # Extract and validate required fields
        required_fields = ['age', 'gender']
        for field in required_fields:
            if field not in patient_data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Process patient data for ML model
        ml_data = {
            'age': int(patient_data.get('age', 30)),
            'gender': patient_data.get('gender', 'Male'),
            'smoking_history': patient_data.get('smoking_history', 'never'),
            'bmi': float(patient_data.get('bmi', 25.0)),
            'hba1c': float(patient_data.get('hba1c', patient_data.get('HbA1c_level', 5.5))),
            'blood_glucose': float(patient_data.get('blood_glucose', patient_data.get('sbp', 100))),
            'disease': patient_data.get('disease', ''),
            'hypertension': patient_data.get('hypertension', 0),
            'heart_disease': patient_data.get('heart_disease', 0)
        }
        
        # Make prediction using enhanced model
        prediction_result = predict_health_risk(ml_data)
        
        # Format response
        response = {
            'risk_level': prediction_result['risk_level'],
            'risk_score': prediction_result['risk_score'],
            'confidence': prediction_result['confidence'],
            'recommendations': prediction_result['recommendations'],
            'risk_factors': prediction_result['risk_factors'],
            'model_version': prediction_result['model_version'],
            'features_used': prediction_result['features_used'],
            'timestamp': datetime.now().isoformat(),
            'patient_info': {
                'name': patient_data.get('name', 'Unknown'),
                'age': ml_data['age'],
                'gender': ml_data['gender']
            }
        }
        
        logger.info(f"🎯 Prediction completed: {prediction_result['risk_level']} risk for {patient_data.get('name', 'Unknown')}")
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"❌ Prediction error: {str(e)}")
        return jsonify({
            'error': 'Prediction failed',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/model-info', methods=['GET'])
def model_info():
    """Get detailed model information"""
    try:
        model_info = get_model_info()
        return jsonify(model_info), 200
    except Exception as e:
        logger.error(f"Failed to get model info: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/features', methods=['GET'])
def get_features():
    """Get model feature information"""
    try:
        model_info = get_model_info()
        return jsonify({
            'feature_names': model_info.get('feature_names', []),
            'input_features': model_info.get('input_features', 0),
            'architecture': model_info.get('architecture', 'Unknown')
        }), 200
    except Exception as e:
        logger.error(f"Failed to get features: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/test-prediction', methods=['GET'])
def test_prediction():
    """Test endpoint with sample data"""
    try:
        # Sample patient data for testing
        test_data = {
            'age': 45,
            'gender': 'Male',
            'smoking_history': 'former',
            'bmi': 28.5,
            'hba1c': 6.2,
            'blood_glucose': 120,
            'disease': 'hypertension',
            'hypertension': 1,
            'heart_disease': 0
        }
        
        prediction_result = predict_health_risk(test_data)
        
        return jsonify({
            'message': 'Test prediction successful',
            'test_data': test_data,
            'prediction': prediction_result,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Test prediction failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/patient-analysis', methods=['POST'])
def patient_analysis():
    """Comprehensive patient analysis endpoint"""
    try:
        patient_data = request.get_json()
        
        if not patient_data:
            return jsonify({'error': 'No patient data provided'}), 400
        
        logger.info(f"🔬 Comprehensive analysis for: {patient_data.get('name', 'Unknown')}")
        
        # Enhanced patient data processing
        enhanced_data = {
            'age': int(patient_data.get('age', 30)),
            'gender': patient_data.get('gender', 'Male'),
            'smoking_history': patient_data.get('smoking_history', 'never'),
            'bmi': float(patient_data.get('bmi', 25.0)),
            'hba1c': float(patient_data.get('hba1c', 5.5)),
            'blood_glucose': float(patient_data.get('blood_glucose', 100)),
            'sbp': int(patient_data.get('sbp', 120)),
            'disease': patient_data.get('disease', ''),
            'hypertension': 1 if 'hypertension' in str(patient_data.get('disease', '')).lower() else 0,
            'heart_disease': 1 if 'heart' in str(patient_data.get('disease', '')).lower() else 0
        }
        
        # Get ML prediction
        prediction_result = predict_health_risk(enhanced_data)
        
        # Enhanced response with additional insights
        response = {
            'patient_summary': {
                'name': patient_data.get('name', 'Unknown'),
                'age': enhanced_data['age'],
                'gender': enhanced_data['gender'],
                'bmi_category': get_bmi_category(enhanced_data['bmi']),
                'glucose_status': get_glucose_status(enhanced_data['blood_glucose']),
                'bp_status': get_bp_status(enhanced_data['sbp'])
            },
            'risk_assessment': {
                'level': prediction_result['risk_level'],
                'score': round(prediction_result['risk_score'] * 100, 1),
                'confidence': round(prediction_result['confidence'] * 100, 1),
                'category': get_risk_category(prediction_result['risk_level'])
            },
            'health_insights': {
                'risk_factors': prediction_result['risk_factors'],
                'recommendations': prediction_result['recommendations'],
                'priority_actions': get_priority_actions(prediction_result['risk_level']),
                'monitoring_frequency': get_monitoring_frequency(prediction_result['risk_level'])
            },
            'model_info': {
                'version': prediction_result['model_version'],
                'features_analyzed': len(prediction_result['features_used']),
                'accuracy': get_model_info().get('efficiency_percentage', 'Unknown')
            },
            'timestamp': datetime.now().isoformat()
        }
        
        logger.info(f"🎯 Analysis completed: {prediction_result['risk_level']} risk")
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"❌ Analysis error: {str(e)}")
        return jsonify({
            'error': 'Analysis failed',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

def get_bmi_category(bmi):
    """Categorize BMI"""
    if bmi < 18.5:
        return "Underweight"
    elif bmi < 25:
        return "Normal"
    elif bmi < 30:
        return "Overweight"
    else:
        return "Obese"

def get_glucose_status(glucose):
    """Categorize blood glucose"""
    if glucose < 100:
        return "Normal"
    elif glucose < 126:
        return "Prediabetic"
    else:
        return "Diabetic"

def get_bp_status(sbp):
    """Categorize blood pressure"""
    if sbp < 120:
        return "Normal"
    elif sbp < 130:
        return "Elevated"
    elif sbp < 140:
        return "Stage 1 Hypertension"
    else:
        return "Stage 2 Hypertension"

def get_risk_category(risk_level):
    """Get detailed risk category"""
    categories = {
        'LOW': 'Minimal health risk - maintain current lifestyle',
        'MEDIUM': 'Moderate risk - lifestyle changes recommended',
        'HIGH': 'High risk - immediate medical attention advised'
    }
    return categories.get(risk_level, 'Unknown risk level')

def get_priority_actions(risk_level):
    """Get priority actions based on risk level"""
    actions = {
        'LOW': ['Continue healthy habits', 'Annual checkups', 'Regular exercise'],
        'MEDIUM': ['Lifestyle modifications', 'Quarterly checkups', 'Diet changes'],
        'HIGH': ['Immediate medical consultation', 'Daily monitoring', 'Medication review']
    }
    return actions.get(risk_level, [])

def get_monitoring_frequency(risk_level):
    """Get monitoring frequency recommendation"""
    frequency = {
        'LOW': 'Annual monitoring',
        'MEDIUM': 'Quarterly monitoring',
        'HIGH': 'Weekly or daily monitoring'
    }
    return frequency.get(risk_level, 'Consult healthcare provider')

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    logger.info("🚀 Starting Healthcare DApp API...")
    
    try:
        # Load the enhanced model
        if load_model():
            model_info = get_model_info()
            logger.info("✅ Enhanced model loaded successfully!")
            logger.info(f"📊 Model efficiency: {model_info.get('efficiency_percentage', 'Unknown')}%")
            logger.info(f"🏗️ Architecture: {model_info.get('architecture', 'Unknown')}")
            logger.info(f"🔢 Features: {model_info.get('input_features', 'Unknown')}")
            
            # Start Flask app
            logger.info("🌐 Starting Flask server...")
            app.run(
                host='127.0.0.1',
                port=5000,
                debug=True,
                use_reloader=False  # Prevent double loading in debug mode
            )
        else:
            logger.error("❌ Failed to load model. Please run training_pipeline.py first!")
            print("\n📁 To train your enhanced model, run:")
            print("python api/training_pipeline.py")
            
    except Exception as e:
        logger.error(f"❌ Failed to start API: {str(e)}")
        print(f"\n❌ Error details: {str(e)}")
        print("\n🔧 Troubleshooting:")
        print("1. Make sure you've trained the model: python api/training_pipeline.py")
        print("2. Check if models/ directory exists with model files")
        print("3. Verify all dependencies are installed")
        raise