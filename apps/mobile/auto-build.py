#!/usr/bin/env python3

import subprocess
import os
import time

# Set the token
os.environ['EXPO_TOKEN'] = '9zH76AUhi5_HzrOL1TbdjuxAtWBIxYfJfxrM2_kO'

print("🚀 Starting automated EAS build process...")

# First, try to create the project using stdin
print("Creating EAS project...")
try:
    # Use echo to send 'y' responses
    process = subprocess.Popen(
        ['bash', '-c', 'echo -e "y\ny\ny" | eas init'],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    stdout, stderr = process.communicate(timeout=30)
    print("Init output:", stdout)
    if stderr:
        print("Init errors (may be normal):", stderr)
except subprocess.TimeoutExpired:
    process.kill()
    print("Init timed out, continuing...")
except Exception as e:
    print(f"Init error: {e}")

# Wait a moment
time.sleep(2)

# Now try to build
print("\n📦 Starting Android build...")
try:
    result = subprocess.run(
        ['eas', 'build', '--platform', 'android', '--profile', 'preview', '--non-interactive'],
        capture_output=True,
        text=True,
        timeout=60
    )
    print("Build output:", result.stdout)
    if result.stderr:
        print("Build errors:", result.stderr)
    
    if result.returncode == 0:
        print("\n✅ Build started successfully!")
        print("Check your email or https://expo.dev for the build status.")
    else:
        print("\n⚠️ Build command returned non-zero status")
        print("Attempting alternative approach...")
        
        # Try without non-interactive flag
        process2 = subprocess.Popen(
            ['bash', '-c', 'echo -e "y\ny\ny" | eas build --platform android --profile preview'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        stdout2, stderr2 = process2.communicate(timeout=60)
        print("Alternative output:", stdout2)
        if stderr2:
            print("Alternative errors:", stderr2)
            
except subprocess.TimeoutExpired:
    print("Build command timed out")
except Exception as e:
    print(f"Build error: {e}")

print("\n🔍 Checking build status...")
try:
    status = subprocess.run(['eas', 'build:list', '--limit', '1'], capture_output=True, text=True)
    print(status.stdout)
except:
    print("Could not check build status")