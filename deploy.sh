#!/bin/bash

echo "========================================"
echo "Healthcare DApp - Docker Deployment"
echo "========================================"
echo

# Check if Docker is running
if ! docker --version > /dev/null 2>&1; then
    echo "❌ ERROR: Docker is not running or not installed!"
    echo "Please make sure Docker is installed and running."
    exit 1
fi

echo "✅ Docker is running!"
echo

echo "Building and starting the application..."
echo "This may take a few minutes on first run..."
echo

# Stop any existing containers
docker-compose down --remove-orphans

# Build and start services
docker-compose up --build -d

if [ $? -eq 0 ]; then
    echo
    echo "========================================"
    echo "🎉 SUCCESS! Healthcare DApp is running!"
    echo "========================================"
    echo
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:5000"
    echo "📊 Health Check: http://localhost:5000/health"
    echo "⛓️ Ganache Blockchain: http://localhost:7545"
    echo
    echo "ℹ️ To stop: ./stop.sh"
    echo "ℹ️ To view logs: docker-compose logs -f"
    echo
    
    # Try to open in browser (works on macOS)
    if command -v open > /dev/null 2>&1; then
        echo "Opening application in browser..."
        sleep 3
        open http://localhost:3000
    elif command -v xdg-open > /dev/null 2>&1; then
        echo "Opening application in browser..."
        sleep 3
        xdg-open http://localhost:3000
    fi
else
    echo
    echo "❌ ERROR: Failed to start the application!"
    echo "Check the logs above for details."
    echo
fi

echo "Press Enter to continue..."
read