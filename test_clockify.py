#!/usr/bin/env python3
"""
Test Clockify API connection
"""

import requests
import json

API_KEY = "ODc5M2U0ODktMmM0Yy00ZTI5LWI2MDktNDg3MzUxZmQ1Zjll"
BASE_URL = "https://api.clockify.me/api/v1"

headers = {
    "X-Api-Key": API_KEY,
    "Content-Type": "application/json"
}

# Test 1: Get user info
print("Testing Clockify API connection...")
print("-" * 50)

user_response = requests.get(f"{BASE_URL}/user", headers=headers)

if user_response.status_code == 200:
    user_data = user_response.json()
    print("✅ Successfully connected to Clockify!")
    print(f"User: {user_data.get('name', 'Unknown')}")
    print(f"Email: {user_data.get('email', 'Unknown')}")
    workspace_id = user_data.get('defaultWorkspace')
    print(f"Workspace ID: {workspace_id}")
    print("-" * 50)
    
    # Test 2: Get workspace details
    if workspace_id:
        workspace_response = requests.get(
            f"{BASE_URL}/workspaces/{workspace_id}",
            headers=headers
        )
        
        if workspace_response.status_code == 200:
            workspace_data = workspace_response.json()
            print(f"Workspace Name: {workspace_data.get('name', 'Unknown')}")
            
            # Test 3: Get projects
            projects_response = requests.get(
                f"{BASE_URL}/workspaces/{workspace_id}/projects",
                headers=headers
            )
            
            if projects_response.status_code == 200:
                projects = projects_response.json()
                print(f"Number of projects: {len(projects)}")
                
                if projects:
                    print("\nExisting Projects:")
                    for project in projects[:5]:  # Show first 5
                        print(f"  - {project.get('name')}")
                else:
                    print("No projects found. Will create them when automation starts.")
            else:
                print(f"❌ Failed to get projects: {projects_response.status_code}")
                print(projects_response.text)
        else:
            print(f"❌ Failed to get workspace: {workspace_response.status_code}")
    
    print("-" * 50)
    print("✅ API Key is valid and working!")
    print("\nNext steps:")
    print("1. Run the automation script to start tracking")
    print("2. No webhooks needed - API key is sufficient")
    print("3. Time entries will appear in your Clockify dashboard")
    
else:
    print(f"❌ Failed to connect: {user_response.status_code}")
    print(user_response.text)
    print("\nPlease check:")
    print("1. API key is correct")
    print("2. Internet connection is working")
    print("3. Clockify API is accessible")