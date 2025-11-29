#!/bin/bash

echo "Setting up Expo project and building..."

# Set token
export EXPO_TOKEN=9zH76AUhi5_HzrOL1TbdjuxAtWBIxYfJfxrM2_kO

# Check login
echo "Checking login status..."
eas whoami

# Try to init with a yes response
echo "Initializing project..."
yes | eas init 2>/dev/null || echo "Project may already be initialized"

# Now build
echo "Starting Android build..."
eas build --platform android --profile preview --clear-cache

echo "Build started! Check your email or https://expo.dev for the build status."