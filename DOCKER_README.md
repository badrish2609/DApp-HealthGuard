# 🐳 Healthcare DApp - Docker Deployment Guide

## Prerequisites

### Required Software
1. **Docker Desktop** - Download from [docker.com](https://www.docker.com/products/docker-desktop)
   - Make sure Docker Desktop is running before deployment
   - Windows users: Enable WSL 2 integration

### System Requirements
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: At least 5GB free space
- **Ports**: 3000, 5000, and 7545 should be available

## 🚀 Quick Start (1-Click Deployment)

### Windows Users
1. Double-click `deploy.bat`
2. Wait for the build process (5-10 minutes first time)
3. The application will open automatically in your browser

### Mac/Linux Users
```bash
chmod +x deploy.sh
./deploy.sh
```

## 📋 Manual Deployment Steps

If you prefer manual control:

```bash
# 1. Build and start all services
docker-compose up --build -d

# 2. Check status
docker-compose ps

# 3. View logs
docker-compose logs -f
```

## 🌐 Access Points

Once deployed, access your application at:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | React.js Web Interface |
| **Backend API** | http://localhost:5000 | Python Flask API |
| **Health Check** | http://localhost:5000/health | API Status |
| **Ganache** | http://localhost:7545 | Local Blockchain |

## 🛠️ Management Commands

### Windows Scripts
- `deploy.bat` - Start the application
- `stop.bat` - Stop all containers
- `logs.bat` - View container logs
- `status.bat` - Check application status

### Docker Compose Commands
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Restart specific service
docker-compose restart [service-name]

# Rebuild and restart
docker-compose up --build -d
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Frontend │────│   Nginx Proxy    │────│  Python Backend │
│   (Port 3000)   │    │   (Port 80)      │    │   (Port 5000)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                          │
                                                ┌─────────────────┐
                                                │  ML Models &    │
                                                │  Training Data  │
                                                └─────────────────┘
```

## 🔧 Configuration

### Environment Variables
You can customize the deployment by creating a `.env` file:

```env
# API Configuration
FLASK_ENV=production
FLASK_PORT=5000

# Frontend Configuration
REACT_APP_API_URL=http://localhost:5000

# Database Configuration (if needed)
DATABASE_URL=sqlite:///healthcare.db
```

### Port Configuration
To change ports, edit `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # Change 8080 to your desired port
  backend:
    ports:
      - "8000:5000"  # Change 8000 to your desired port
```

## 📊 Health Monitoring

### Health Checks
The application includes built-in health checks:

```bash
# Check backend health
curl http://localhost:5000/health

# Check all container status
docker ps --filter "name=healthcare"
```

### Common Health Check Responses
```json
{
  "status": "healthy",
  "message": "Healthcare DApp API is running",
  "model_loaded": true,
  "timestamp": "2025-09-19T10:30:00"
}
```

## 🐛 Troubleshooting

### Common Issues

#### Issue: Docker Desktop not running
**Error**: `docker: command not found` or connection refused
**Solution**: 
1. Start Docker Desktop
2. Wait for it to fully initialize (green whale icon)
3. Try again

#### Issue: Port already in use
**Error**: `port is already allocated`
**Solution**:
```bash
# Find and kill process using the port
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F

# Or change port in docker-compose.yml
```

#### Issue: Build fails due to memory
**Error**: Container build fails or stops
**Solution**:
1. Increase Docker memory limit (Docker Desktop > Settings > Resources)
2. Close other applications
3. Try building one service at a time

#### Issue: Models not loading
**Error**: ML model prediction fails
**Solution**:
```bash
# Check if model files exist
docker exec healthcare-backend ls -la /app/models/

# Rebuild backend with fresh models
docker-compose up --build backend
```

### Debug Commands

```bash
# Enter backend container
docker exec -it healthcare-backend bash

# Enter frontend container
docker exec -it healthcare-frontend sh

# Check container logs
docker logs healthcare-backend
docker logs healthcare-frontend

# Check container resource usage
docker stats healthcare-backend healthcare-frontend
```

## 🚢 Production Deployment

### For Production Use

1. **Security**: Update default passwords and API keys
2. **SSL**: Add HTTPS certificates
3. **Environment**: Set `FLASK_ENV=production`
4. **Monitoring**: Add logging and monitoring services
5. **Backup**: Regular backup of model files and data

### Docker Hub Deployment

```bash
# Tag images
docker tag healthcare-backend:latest yourusername/healthcare-backend:latest
docker tag healthcare-frontend:latest yourusername/healthcare-frontend:latest

# Push to Docker Hub
docker push yourusername/healthcare-backend:latest
docker push yourusername/healthcare-frontend:latest
```

### Cloud Deployment (AWS/Azure/GCP)

The application is ready for cloud deployment using:
- **AWS**: ECS, EKS, or Elastic Beanstalk
- **Azure**: Container Instances or AKS
- **Google Cloud**: Cloud Run or GKE

## 📁 File Structure

```
healthcareDapp/
├── docker-compose.yml      # Main orchestration file
├── Dockerfile             # Frontend Docker configuration
├── nginx.conf             # Nginx configuration
├── deploy.bat             # Windows deployment script
├── stop.bat              # Stop script
├── logs.bat              # Log viewing script
├── status.bat            # Status check script
├── api/
│   ├── Dockerfile        # Backend Docker configuration
│   ├── app.py           # Flask application
│   ├── requirements.txt # Python dependencies
│   └── models/          # ML models directory
└── src/                 # React frontend source
```

## 📞 Support

### Getting Help

1. **Check logs**: Use `logs.bat` or `docker-compose logs`
2. **Verify status**: Use `status.bat` or `docker ps`
3. **Restart services**: Use `stop.bat` then `deploy.bat`

### Performance Tips

1. **First run**: Initial build takes 5-10 minutes
2. **Subsequent runs**: Much faster due to Docker caching
3. **Memory usage**: Monitor with `docker stats`
4. **Cleanup**: Run `docker system prune` occasionally

## 🎯 Next Steps

After successful deployment:

1. **Test the API**: Visit http://localhost:5000/health
2. **Use the frontend**: Visit http://localhost:3000
3. **Explore features**: Try the health risk prediction
4. **Customize**: Modify the application for your needs
5. **Deploy to cloud**: Follow production deployment guide

---

## 📝 Quick Reference

| Action | Command |
|--------|---------|
| Deploy | `deploy.bat` or `docker-compose up -d` |
| Stop | `stop.bat` or `docker-compose down` |
| Logs | `logs.bat` or `docker-compose logs` |
| Status | `status.bat` or `docker ps` |
| Restart | `docker-compose restart` |
| Rebuild | `docker-compose up --build -d` |

**Happy Deployment! 🎉**