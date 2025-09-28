#!/bin/bash

echo "🚀 USIM Web Deployment Script"
echo "============================"

# Function to kill all processes on port 3000
kill_port_3000() {
    echo "🔪 Killing all processes on port 3000..."

    # Kill by port
    sudo lsof -ti:3000 | xargs sudo kill -9 2>/dev/null || true

    # Kill by process name
    sudo pkill -f "next" -9 || true
    sudo pkill -f "node.*3000" -9 || true
    sudo pkill -f "npm.*start" -9 || true

    # Kill PM2 processes
    pm2 kill 2>/dev/null || true

    # Wait for processes to die
    sleep 3

    # Verify port is free
    if sudo lsof -i :3000 > /dev/null 2>&1; then
        echo "❌ Failed to free port 3000"
        exit 1
    else
        echo "✅ Port 3000 is free"
    fi
}

# Function to build application
build_app() {
    echo "🔨 Building application..."
    npm run build

    if [ $? -ne 0 ]; then
        echo "❌ Build failed"
        exit 1
    fi

    echo "✅ Build successful"
}

# Function to start application
start_app() {
    echo "🚀 Starting application..."

    # Start with PM2
    pm2 start npm --name "usim-web" -- start

    if [ $? -ne 0 ]; then
        echo "❌ Failed to start application"
        exit 1
    fi

    # Wait for app to start
    sleep 5

    # Check if app is running
    if pm2 list | grep -q "usim-web.*online"; then
        echo "✅ Application started successfully"
        pm2 status
    else
        echo "❌ Application failed to start"
        pm2 logs usim-web --lines 10
        exit 1
    fi
}

# Function to check application health
check_health() {
    echo "🏥 Checking application health..."

    # Test HTTP endpoint
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
        echo "✅ Application is healthy"
    else
        echo "❌ Application health check failed"
        exit 1
    fi
}

# Main deployment process
main() {
    echo "📋 Starting deployment process..."

    kill_port_3000
    build_app
    start_app
    check_health

    echo ""
    echo "🎉 Deployment completed successfully!"
    echo "🌐 Application is running at: https://daily.telebox.vn"
    echo ""
    echo "📊 Monitor logs with: pm2 logs usim-web"
    echo "🔄 Restart with: pm2 restart usim-web"
    echo "🛑 Stop with: pm2 stop usim-web"
}

# Run main function
main "$@"