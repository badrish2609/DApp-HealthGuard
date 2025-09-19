# 🚨 Railway Deployment Crash - Troubleshooting Guide

## Common Railway Deployment Issues & Solutions

### 🔍 **Step 1: Check Railway Logs**
1. Go to your Railway dashboard
2. Click on the crashed service
3. Go to **"Deployments"** tab
4. Click on the failed deployment
5. Check the **build logs** and **deployment logs**

### 🔧 **Most Common Issues & Fixes:**

#### **Issue 1: Wrong Root Directory**
**Error**: `Could not find Dockerfile` or `No such file or directory`
**Solution**:
```
Backend Service Settings:
- Root Directory: DApp/healthcareDapp/api
- NOT: /DApp/healthcareDapp/api
- NOT: api/
```

#### **Issue 2: Missing Dependencies in Dockerfile**
**Error**: `Package not found` or `pip install failed`
**Solution**: Update the API Dockerfile with missing dependencies

#### **Issue 3: Port Configuration**
**Error**: `Application failed to respond on port`
**Solution**: 
- Backend: Set port to `5000` 
- Frontend: Set port to `80`
- Add `PORT` environment variable

#### **Issue 4: Build Timeout**
**Error**: `Build exceeded time limit`
**Solution**: Use smaller base images or optimize Dockerfile

#### **Issue 5: Memory Issues**
**Error**: `Out of memory` or `Killed`
**Solution**: Optimize dependencies or upgrade Railway plan

### 🛠️ **Quick Fixes to Try:**

#### **Fix 1: Update Backend Dockerfile**
Your current API Dockerfile might need optimization:
```dockerfile
# Use smaller Python image
FROM python:3.11-slim

WORKDIR /app

# Install only essential system packages
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Use Railway's PORT environment variable
EXPOSE ${PORT:-5000}

CMD ["python", "-m", "flask", "run", "--host=0.0.0.0", "--port=${PORT:-5000}"]
```

#### **Fix 2: Update requirements.txt**
Make sure your API requirements.txt has exact versions:
```txt
Flask==3.0.0
flask-cors==4.0.0
torch>=2.0.0
numpy>=1.24.0
pandas>=2.0.0
scikit-learn>=1.3.0
joblib>=1.3.0
gunicorn>=21.2.0
```

#### **Fix 3: Add Railway-specific Files**

Create `DApp/healthcareDapp/api/Procfile`:
```
web: gunicorn app:app --bind 0.0.0.0:$PORT
```

Create `DApp/healthcareDapp/api/railway.toml`:
```toml
[build]
builder = "dockerfile"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "on-failure"
restartPolicyMaxRetries = 10
```

### 🎯 **Step-by-Step Recovery:**

#### **Method 1: Fix and Redeploy**
1. **Identify the error** from Railway logs
2. **Fix the issue** locally
3. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Fix Railway deployment issue"
   git push origin master:main
   ```
4. **Redeploy** in Railway dashboard

#### **Method 2: Manual Service Configuration**
1. **Delete** the crashed services in Railway
2. **Create new service**
3. **Connect to GitHub repo**
4. **Manually set**:
   - Root Directory: `DApp/healthcareDapp/api` (for backend)
   - Root Directory: `DApp/healthcareDapp` (for frontend)
5. **Add environment variables**

### 🚨 **Emergency Alternative: Simplified Deployment**

If Railway keeps crashing, try this simplified approach:

#### **Option A: Deploy Frontend Only First**
1. Create service for frontend only
2. Set root directory: `DApp/healthcareDapp`
3. Get it working, then add backend later

#### **Option B: Use Different Platform**
- **Render**: https://render.com (similar to Railway)
- **Vercel**: For frontend deployment
- **Heroku**: Classic option

### 🔍 **Common Error Messages & Solutions:**

| Error Message | Solution |
|---------------|----------|
| `Error: ENOENT: no such file or directory` | Check root directory path |
| `Failed to build: The engine "node" is incompatible` | Add `.nvmrc` file or specify Node version |
| `ModuleNotFoundError: No module named 'flask'` | Fix requirements.txt or Dockerfile |
| `Error: Could not find a production build` | Frontend build failed - check package.json scripts |
| `Application error` | Check application logs for specific error |

### 📤 **Quick Actions:**

#### **If Backend Crashed:**
```bash
# Add to your local api/ folder, then push:
echo "web: python app.py" > Procfile
git add . && git commit -m "Add Procfile" && git push origin master:main
```

#### **If Frontend Crashed:**
```bash
# Check if build script exists in package.json
# Add if missing:
"scripts": {
  "build": "react-scripts build"
}
```

---

## 🎯 **Tell me:**
1. **Which service crashed?** (Frontend/Backend/Both)
2. **What error message** did you see in Railway logs?
3. **At what stage** did it fail? (Build/Deploy/Runtime)

**I'll provide specific fixes based on your exact error!** 🔧