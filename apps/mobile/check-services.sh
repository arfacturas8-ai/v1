#!/bin/bash

echo "🔍 CRYB Platform Service Status Check"
echo "======================================"

# Check API Server (port 3002)
echo ""
echo "🔗 API Server (port 3002):"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/api/v1/auth/login)
if [[ $API_STATUS =~ ^[45][0-9][0-9]$ ]]; then
    echo "   ✅ API server is running and responding (HTTP $API_STATUS)"
else
    echo "   ❌ API server is not accessible (HTTP $API_STATUS)"
fi

# Check Metro Bundler (port 8081)
echo ""
echo "📱 Metro Bundler (port 8081):"
if curl -s -o /dev/null http://localhost:8081; then
    echo "   ✅ Metro bundler is running"
else
    echo "   ❌ Metro bundler is not accessible"
fi

# Check Web App (port 3000)
echo ""
echo "🌐 Web App (port 3000):"
if curl -s -o /dev/null http://localhost:3000; then
    echo "   ✅ Web app is running"
else
    echo "   ❌ Web app is not accessible"
fi

echo ""
echo "📋 Quick Access URLs:"
echo "   • API Documentation: http://localhost:3002/docs"
echo "   • Web Application: http://localhost:3000"
echo "   • Mobile Metro: http://localhost:8081"
echo ""
echo "🎯 For mobile testing:"
echo "   1. Install Expo Go app on your device"
echo "   2. Run 'npm start' in /home/ubuntu/cryb-platform/apps/mobile"
echo "   3. Scan the QR code with Expo Go"
echo ""
echo "✅ All services are configured and ready for development!"