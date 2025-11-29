#!/bin/bash

echo "🔧 Testing file upload endpoints with generated token..."

# Use the generated token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItMTIzIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzU5MDkxMjg0LCJleHAiOjE3NTkxNzc2ODR9.hi6F1DwGznYc0wGzSv1ve_BL1QT4Uc8Aei6f51V8Lzs"

# Create a test file
echo "Hello from CRYB upload test!" > test-upload.txt

echo "✅ Using test token: ${TOKEN:0:50}..."

# Test avatar upload
echo ""
echo "1. Testing avatar upload..."
AVATAR_RESPONSE=$(curl -s -w "HTTP_CODE:%{http_code}" -X POST http://localhost:3002/api/v1/uploads/avatar \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-upload.txt;type=text/plain")

echo "Avatar upload response: $AVATAR_RESPONSE"

# Test media upload
echo ""
echo "2. Testing media upload..."
MEDIA_RESPONSE=$(curl -s -w "HTTP_CODE:%{http_code}" -X POST http://localhost:3002/api/v1/uploads/media \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-upload.txt;type=text/plain")

echo "Media upload response: $MEDIA_RESPONSE"

# Test attachment upload
echo ""
echo "3. Testing attachment upload..."
ATTACHMENT_RESPONSE=$(curl -s -w "HTTP_CODE:%{http_code}" -X POST http://localhost:3002/api/v1/uploads/attachment \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@test-upload.txt;type=text/plain")

echo "Attachment upload response: $ATTACHMENT_RESPONSE"

# Test document upload
echo ""
echo "4. Testing document upload..."
DOCUMENT_RESPONSE=$(curl -s -w "HTTP_CODE:%{http_code}" -X POST http://localhost:3002/api/v1/uploads/document \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-upload.txt;type=text/plain")

echo "Document upload response: $DOCUMENT_RESPONSE"

# Test file listing
echo ""
echo "5. Testing file listing..."
LIST_RESPONSE=$(curl -s -w "HTTP_CODE:%{http_code}" -X GET http://localhost:3002/api/v1/uploads/ \
  -H "Authorization: Bearer $TOKEN")

echo "File listing response: $LIST_RESPONSE"

# Test upload stats
echo ""
echo "6. Testing upload stats..."
STATS_RESPONSE=$(curl -s -w "HTTP_CODE:%{http_code}" -X GET http://localhost:3002/api/v1/uploads/stats \
  -H "Authorization: Bearer $TOKEN")

echo "Upload stats response: $STATS_RESPONSE"

# Test presigned URL generation
echo ""
echo "7. Testing presigned URL generation..."
PRESIGNED_RESPONSE=$(curl -s -w "HTTP_CODE:%{http_code}" -X POST http://localhost:3002/api/v1/uploads/presigned-url \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "presigned-test.txt",
    "contentType": "text/plain",
    "bucket": "cryb-uploads"
  }')

echo "Presigned URL response: $PRESIGNED_RESPONSE"

# Cleanup
rm -f test-upload.txt

echo ""
echo "🎉 Upload endpoint testing completed!"
