#!/bin/bash

# Create comprehensive Reddit sample data
API_BASE="http://localhost:3001/api/v1"
TOKEN1="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWZsdnFueTYwMDAwZzczcXN3Ym5nZjU1Iiwic2Vzc2lvbklkIjoiNWI5MDMzMjEtOGUzYS00NTI5LWJhMzctMDc0ZGNjNDU2NjY5IiwiZW1haWwiOm51bGwsIndhbGxldEFkZHJlc3MiOm51bGwsImlzVmVyaWZpZWQiOmZhbHNlLCJqdGkiOiIzMzI1NzhkZC1kNTRmLTRmZjQtYmNkOS1hNGQxMmE2NTQyYTQiLCJpYXQiOjE3NTc5ODY0OTMsImV4cCI6MTc1Nzk4NzM5MywiYXVkIjoiY3J5Yi11c2VycyIsImlzcyI6ImNyeWItcGxhdGZvcm0ifQ.I8aDbsTe81n-2MfKXjLDXPmIrublbwk3ot804GbByNU"
TOKEN2="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWZsdnhib3YwMDBrZzczcWI2dGh3am52Iiwic2Vzc2lvbklkIjoiNGUyOTdhNjQtZDgyOC00ODhiLTgzYWYtMzgwNTFjZTBiOTc3IiwiZW1haWwiOm51bGwsIndhbGxldEFkZHJlc3MiOm51bGwsImlzVmVyaWZpZWQiOmZhbHNlLCJqdGkiOiJmYWM1ZDQyNS01ZjZlLTQzMzEtYWZhMy1jMzE1Y2QyYWY2ZjEiLCJpYXQiOjE3NTc5ODY3NTcsImV4cCI6MTc1Nzk4NzY1NywiYXVkIjoiY3J5Yi11c2VycyIsImlzcyI6ImNyeWItcGxhdGZvcm0ifQ.dj9wq_iioiSVOtUmMb8Ota9Pju6K1n1q7oMbV0O0Kic"

echo "🚀 Creating Reddit sample data..."

# Create additional communities
echo "📱 Creating communities..."

curl -s -X POST "$API_BASE/communities" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN1" \
  -d '{
    "name": "technology",
    "displayName": "Technology",
    "description": "Latest technology news, gadgets, and innovations",
    "isPublic": true
  }' | echo "Technology community created"

curl -s -X POST "$API_BASE/communities" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN2" \
  -d '{
    "name": "gaming", 
    "displayName": "Gaming",
    "description": "Gaming news, reviews, and discussions",
    "isPublic": true
  }' | echo "Gaming community created"

curl -s -X POST "$API_BASE/communities" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN1" \
  -d '{
    "name": "askreddit",
    "displayName": "Ask Reddit",
    "description": "Ask the community anything",
    "isPublic": true
  }' | echo "AskReddit community created"

echo "📝 Creating posts..."

# Create more posts in programming community
curl -s -X POST "$API_BASE/posts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN2" \
  -d '{
    "communityId": "cmflvqx360001g73qk3lngnmv",
    "title": "Best VS Code extensions for productivity?",
    "content": "What VS Code extensions do you use daily that boost your productivity? I am currently using Prettier, ESLint, and GitLens but looking for more recommendations."
  }' | echo "VS Code extensions post created"

curl -s -X POST "$API_BASE/posts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN1" \
  -d '{
    "communityId": "cmflvqx360001g73qk3lngnmv",
    "title": "Python vs JavaScript for beginners",
    "content": "I am trying to decide between Python and JavaScript as my first programming language. What are the pros and cons of each for someone just starting out?"
  }' | echo "Python vs JS post created"

echo "✅ Reddit sample data creation completed!"
echo ""
echo "🔍 Test the Reddit features with these endpoints:"
echo "- GET $API_BASE/communities (list communities)"
echo "- GET $API_BASE/posts (list all posts)"
echo "- GET $API_BASE/comments/post/[POST_ID] (get comments for a post)"
echo "- POST $API_BASE/posts/[POST_ID]/vote (vote on posts)"
echo "- POST $API_BASE/comments/[COMMENT_ID]/vote (vote on comments)"
echo "- POST $API_BASE/communities/[COMMUNITY_NAME]/join (join community)"