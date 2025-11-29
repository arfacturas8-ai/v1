#!/bin/bash

echo "🔧 Testing file upload endpoints..."

# Create a test file
echo "Hello from CRYB upload test!" > test-upload.txt

# First get an auth token by registering/logging in
echo "1. Getting authentication token..."

# Try to register a test user (if it already exists, it will fail but we'll try login)
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3002/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuploaduser",
    "email": "testupload@example.com", 
    "password": "TestPassword123!",
    "confirmPassword": "TestPassword123!"
  }')

echo "Register response: $REGISTER_RESPONSE"

# Try to login to get token
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3002/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testupload@example.com",
    "password": "TestPassword123!"
  }')

echo "Login response: $LOGIN_RESPONSE"

# Extract token from response (assuming JSON format)
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | sed 's/"token":"\([^"]*\)"/\1/')

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get authentication token"
  cat test-upload.txt
  exit 1
fi

echo "✅ Got token: ${TOKEN:0:20}..."

# Test avatar upload
echo ""
echo "2. Testing avatar upload..."
AVATAR_RESPONSE=$(curl -s -X POST http://localhost:3002/api/v1/uploads/avatar \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-upload.txt;type=text/plain")

echo "Avatar upload response: $AVATAR_RESPONSE"

# Test media upload
echo ""
echo "3. Testing media upload..."
MEDIA_RESPONSE=$(curl -s -X POST http://localhost:3002/api/v1/uploads/media \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-upload.txt;type=text/plain")

echo "Media upload response: $MEDIA_RESPONSE"

# Test attachment upload
echo ""
echo "4. Testing attachment upload..."
ATTACHMENT_RESPONSE=$(curl -s -X POST http://localhost:3002/api/v1/uploads/attachment \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@test-upload.txt;type=text/plain")

echo "Attachment upload response: $ATTACHMENT_RESPONSE"

# Test file listing
echo ""
echo "5. Testing file listing..."
LIST_RESPONSE=$(curl -s -X GET http://localhost:3002/api/v1/uploads/ \
  -H "Authorization: Bearer $TOKEN")

echo "File listing response: $LIST_RESPONSE"

# Test upload stats
echo ""
echo "6. Testing upload stats..."
STATS_RESPONSE=$(curl -s -X GET http://localhost:3002/api/v1/uploads/stats \
  -H "Authorization: Bearer $TOKEN")

echo "Upload stats response: $STATS_RESPONSE"

# Cleanup
rm -f test-upload.txt

echo ""
echo "🎉 Upload endpoint testing completed!"
