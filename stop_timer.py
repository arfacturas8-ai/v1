#!/usr/bin/env python3
"""
Stop the current running timer
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

# Read the saved entry ID
try:
    with open('/home/ubuntu/cryb-platform/current_timer.txt', 'r') as f:
        entry_id = f.read().strip()
    
    # Stop the timer by updating with end time
    end_time = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    
    response = requests.patch(
        f"{BASE_URL}/workspaces/{WORKSPACE_ID}/time-entries/{entry_id}",
        headers=headers,
        json={"end": end_time}
    )
    
    if response.status_code == 200:
        print("✅ Timer stopped successfully!")
    else:
        print(f"❌ Failed to stop timer: {response.text}")
        
except FileNotFoundError:
    print("No running timer found")