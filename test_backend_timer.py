#!/usr/bin/env python3
"""
Test timer with simplified format: Backend - Task description
"""

import requests
from datetime import datetime

API_KEY = "ODc5M2U0ODktMmM0Yy00ZTI5LWI2MDktNDg3MzUxZmQ1Zjll"
BASE_URL = "https://api.clockify.me/api/v1"
WORKSPACE_ID = "6895a6365597d57d09672a8d"

headers = {
    "X-Api-Key": API_KEY,
    "Content-Type": "application/json"
}

# Get project ID
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
            break

# Start timer with simplified format
timer_data = {
    "start": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    "billable": True,
    "description": "Backend - Implementing PostgreSQL database schema with 27 tables",
    "projectId": project_id,
    "tagIds": []
}

print("🚀 Starting Backend Timer Test...")
print("-" * 50)
print(f"Description: {timer_data['description']}")

response = requests.post(
    f"{BASE_URL}/workspaces/{WORKSPACE_ID}/time-entries",
    headers=headers,
    json=timer_data
)

if response.status_code == 201:
    entry = response.json()
    print("\n✅ TIMER STARTED!")
    print(f"Entry ID: {entry.get('id')}")
    print("\nFormat: Backend - [Task description]")
    print("Check your Clockify dashboard!")
    
    with open('/home/ubuntu/cryb-platform/current_timer.txt', 'w') as f:
        f.write(entry.get('id'))
else:
    print(f"❌ Failed: {response.text}")