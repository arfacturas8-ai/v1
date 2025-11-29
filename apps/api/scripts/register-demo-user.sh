#!/bin/bash

# Register a demo user via the API
echo "Creating demo user via API..."

curl -X POST https://api.cryb.ai/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "DemoUser",
    "displayName": "Demo User",
    "email": "demo@cryb.ai",
    "password": "Demo123!@#",
    "confirmPassword": "Demo123!@#"
  }' | jq

echo ""
echo "✅ Demo user created!"
echo "Email: demo@cryb.ai"
echo "Password: Demo123!@#"