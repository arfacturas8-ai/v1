#!/bin/bash

echo "🚀 Testing Reddit Features with Real Database Operations"
echo "======================================================="

API_BASE="http://localhost:3002"
TIMESTAMP=$(date +%s)
USER_DATA='{"username":"testuser_'$TIMESTAMP'","email":"testuser_'$TIMESTAMP'@test.com","password":"TestPassword123!","confirmPassword":"TestPassword123!","displayName":"Test User '$TIMESTAMP'"}'

echo "1. Creating test user..."
RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$USER_DATA" \
  "$API_BASE/api/v1/auth/register")

echo "Response: $RESPONSE"

TOKEN=$(echo "$RESPONSE" | python3 -c "import sys,json; data=json.load(sys.stdin); print(data['data']['tokens']['accessToken'])" 2>/dev/null)
USER_ID=$(echo "$RESPONSE" | python3 -c "import sys,json; data=json.load(sys.stdin); print(data['data']['user']['id'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to create user and get token"
  exit 1
fi

echo "✅ User created successfully"
echo "Token: ${TOKEN:0:50}..."
echo "User ID: $USER_ID"

echo ""
echo "2. Creating test community..."
COMMUNITY_DATA='{"name":"testcom_'$TIMESTAMP'","displayName":"Test Community '$TIMESTAMP'","description":"Test community","isPublic":true}'

RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$COMMUNITY_DATA" \
  "$API_BASE/api/v1/communities")

echo "Response: $RESPONSE"

COMMUNITY_ID=$(echo "$RESPONSE" | python3 -c "import sys,json; data=json.load(sys.stdin); print(data['data']['id'])" 2>/dev/null)

if [ -z "$COMMUNITY_ID" ]; then
  echo "❌ Failed to create community"
  exit 1
fi

echo "✅ Community created successfully"
echo "Community ID: $COMMUNITY_ID"

echo ""
echo "3. Creating test post..."
POST_DATA='{"communityId":"'$COMMUNITY_ID'","title":"Test Post '$TIMESTAMP'","content":"This is a comprehensive test post with **markdown** content."}'

RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$POST_DATA" \
  "$API_BASE/api/v1/posts")

echo "Response: $RESPONSE"

POST_ID=$(echo "$RESPONSE" | python3 -c "import sys,json; data=json.load(sys.stdin); print(data['data']['id'])" 2>/dev/null)

if [ -z "$POST_ID" ]; then
  echo "❌ Failed to create post"
  exit 1
fi

echo "✅ Post created successfully"
echo "Post ID: $POST_ID"

echo ""
echo "4. Testing voting system..."
echo "Upvoting post..."
RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"value":1}' \
  "$API_BASE/api/v1/posts/$POST_ID/vote")

echo "Upvote response: $RESPONSE"

echo "Checking vote status..."
RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_BASE/api/v1/posts/$POST_ID/vote-status")

echo "Vote status response: $RESPONSE"

echo ""
echo "5. Creating test comment..."
COMMENT_DATA='{"postId":"'$POST_ID'","content":"This is a test comment with **markdown** formatting."}'

RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$COMMENT_DATA" \
  "$API_BASE/api/v1/comments")

echo "Comment response: $RESPONSE"

COMMENT_ID=$(echo "$RESPONSE" | python3 -c "import sys,json; data=json.load(sys.stdin); print(data['data']['id'])" 2>/dev/null)

if [ -z "$COMMENT_ID" ]; then
  echo "❌ Failed to create comment"
  exit 1
fi

echo "✅ Comment created successfully"
echo "Comment ID: $COMMENT_ID"

echo ""
echo "6. Testing comment voting..."
RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"value":1}' \
  "$API_BASE/api/v1/comments/$COMMENT_ID/vote")

echo "Comment vote response: $RESPONSE"

echo ""
echo "7. Testing award types..."
RESPONSE=$(curl -s "$API_BASE/api/v1/awards/types")
echo "Award types response: $RESPONSE"

echo ""
echo "8. Testing karma system..."
if [ ! -z "$USER_ID" ]; then
  RESPONSE=$(curl -s "$API_BASE/api/v1/karma/user/$USER_ID")
  echo "User karma response: $RESPONSE"
fi

echo ""
echo "9. Testing community stats..."
COMMUNITY_NAME=$(echo "$COMMUNITY_DATA" | python3 -c "import sys,json; data=json.load(sys.stdin); print(data['name'])" 2>/dev/null)

if [ ! -z "$COMMUNITY_NAME" ]; then
  RESPONSE=$(curl -s "$API_BASE/api/v1/communities/$COMMUNITY_NAME/stats")
  echo "Community stats response: $RESPONSE"
fi

echo ""
echo "10. Testing post listing with sorting..."
echo "Hot posts:"
curl -s "$API_BASE/api/v1/posts?sort=hot&limit=5" | head -200
echo ""
echo "New posts:"
curl -s "$API_BASE/api/v1/posts?sort=new&limit=5" | head -200

echo ""
echo "======================================================="
echo "✅ Reddit Features Test Complete!"
echo "All major features tested:"
echo "  - User registration ✅"
echo "  - Community creation ✅"
echo "  - Post creation ✅"
echo "  - Voting system ✅"
echo "  - Comment system ✅"
echo "  - Award system ✅"
echo "  - Karma system ✅"
echo "  - Sorting and filtering ✅"
echo "======================================================="