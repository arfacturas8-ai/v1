#!/bin/bash

# Start LiveKit Server for Cryb Platform
# This script starts the LiveKit server with the correct configuration

echo "🎙️ Starting LiveKit Server for Cryb Platform..."

# Check if LiveKit server is already running
if lsof -Pi :7880 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️ LiveKit server is already running on port 7880"
    echo "✅ Current status:"
    curl -s http://localhost:3002/api/voice-test/health | python3 -m json.tool 2>/dev/null || echo "API not responding"
    exit 0
fi

# Change to the API directory
cd "$(dirname "$0")"

# Check if livekit.yaml exists
if [ ! -f "livekit.yaml" ]; then
    echo "❌ livekit.yaml configuration file not found!"
    echo "Expected location: $(pwd)/livekit.yaml"
    exit 1
fi

# Check if livekit-server binary is available
if ! command -v livekit-server &> /dev/null; then
    echo "❌ livekit-server command not found!"
    echo "Please install LiveKit server first:"
    echo "curl -sSL https://get.livekit.io | bash"
    exit 1
fi

# Check if Redis is running
if ! redis-cli ping >/dev/null 2>&1; then
    echo "❌ Redis is not running. LiveKit requires Redis."
    echo "Please start Redis first."
    exit 1
fi

echo "✅ Starting LiveKit server..."
echo "📍 Configuration: $(pwd)/livekit.yaml"
echo "🌐 Server will be available at: ws://localhost:7880"
echo "🔑 API Key: APIHmK7VRxK9Xb5M3PqN8Yz2Fw4Jt6Lp"

# Start LiveKit server in background
nohup livekit-server --config livekit.yaml > livekit.log 2>&1 &
LIVEKIT_PID=$!

echo "🚀 LiveKit server started with PID: $LIVEKIT_PID"
echo "📄 Logs available at: $(pwd)/livekit.log"

# Wait a moment for server to start
sleep 3

# Check if the server started successfully
if lsof -Pi :7880 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ LiveKit server is now running on port 7880"
    
    # Test API integration if available
    if curl -s http://localhost:3002/api/voice-test/health >/dev/null 2>&1; then
        echo "✅ API integration test passed"
        curl -s http://localhost:3002/api/voice-test/health | python3 -m json.tool 2>/dev/null
    else
        echo "ℹ️ API server not available for integration test"
    fi
    
    echo ""
    echo "🎉 LiveKit setup complete!"
    echo "📋 Summary:"
    echo "   - Server: ws://localhost:7880"
    echo "   - API Key: APIHmK7VRxK9Xb5M3PqN8Yz2Fw4Jt6Lp"
    echo "   - Secret: LkT9Qx3Vm8Sz5Rn2Bp7Wj4Ht6Fg3Cd1"
    echo "   - Process ID: $LIVEKIT_PID"
    echo "   - Logs: $(pwd)/livekit.log"
    echo ""
    echo "🔧 Voice channels are now ready for use in the Cryb platform!"
    
else
    echo "❌ Failed to start LiveKit server"
    echo "📄 Check logs: $(pwd)/livekit.log"
    exit 1
fi