#!/usr/bin/env python3
"""
Start a real Clockify timer - Live test
"""

import requests
import json
from datetime import datetime

API_KEY = "ODc5M2U0ODktMmM0Yy00ZTI5LWI2MDktNDg3MzUxZmQ1Zjll"
BASE_URL = "https://api.clockify.me/api/v1"
WORKSPACE_ID = "6895a6365597d57d09672a8d"

headers = {
    "X-Api-Key": API_KEY,
    "Content-Type": "application/json"
}

# Get project ID for "THE REAL CRYB"
print("🚀 Starting Clockify Timer Test...")
print("-" * 50)

# Get project details
projects_response = requests.get(
    f"{BASE_URL}/workspaces/{WORKSPACE_ID}/projects",
    headers=headers
)

project_id = None
if projects_response.status_code == 200:
    projects = projects_response.json()
    for project in projects:
        if project.get('name') == 'THE REAL CRYB':
            project_id = project.get('id')
            print(f"✅ Found project: THE REAL CRYB (ID: {project_id})")
            break

# Start a timer (running time entry)
start_time = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

timer_data = {
    "start": start_time,
    "billable": True,
    "description": "[Senior Backend Architect] Setting up AWS infrastructure for 100k users",
    "projectId": project_id,
    "tagIds": []
}

print("\n📝 Creating time entry:")
print(f"   Description: {timer_data['description']}")
print(f"   Start time: {start_time}")
print(f"   Project: THE REAL CRYB")
print("-" * 50)

# Start the timer
response = requests.post(
    f"{BASE_URL}/workspaces/{WORKSPACE_ID}/time-entries",
    headers=headers,
    json=timer_data
)

if response.status_code == 201:
    entry = response.json()
    entry_id = entry.get('id')
    print("\n✅ TIMER STARTED SUCCESSFULLY!")
    print(f"   Entry ID: {entry_id}")
    print(f"   Status: ⏱️ RUNNING")
    print("\n📊 Check your Clockify dashboard - the timer should be running now!")
    print("\n💡 This timer will keep running until you stop it in Clockify")
    print("   or we can stop it programmatically later.")
    
    # Save entry ID for later use
    with open('/home/ubuntu/cryb-platform/current_timer.txt', 'w') as f:
        f.write(entry_id)
    
else:
    print(f"\n❌ Failed to start timer: {response.status_code}")
    print(response.text)