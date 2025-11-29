#!/bin/bash

echo "Indexing sample data in Elasticsearch..."

# Create indices if they don't exist
curl -X PUT "localhost:9200/posts" -H 'Content-Type: application/json' -d'
{
  "mappings": {
    "properties": {
      "title": { "type": "text" },
      "content": { "type": "text" },
      "authorUsername": { "type": "keyword" },
      "communityName": { "type": "keyword" },
      "upvotes": { "type": "integer" },
      "downvotes": { "type": "integer" },
      "createdAt": { "type": "date" }
    }
  }
}' 2>/dev/null

curl -X PUT "localhost:9200/users" -H 'Content-Type: application/json' -d'
{
  "mappings": {
    "properties": {
      "username": { "type": "keyword" },
      "email": { "type": "keyword" },
      "displayName": { "type": "text" },
      "bio": { "type": "text" },
      "createdAt": { "type": "date" }
    }
  }
}' 2>/dev/null

curl -X PUT "localhost:9200/communities" -H 'Content-Type: application/json' -d'
{
  "mappings": {
    "properties": {
      "name": { "type": "keyword" },
      "description": { "type": "text" },
      "memberCount": { "type": "integer" },
      "isPublic": { "type": "boolean" },
      "createdAt": { "type": "date" }
    }
  }
}' 2>/dev/null

# Index some sample posts
curl -X POST "localhost:9200/posts/_doc/1" -H 'Content-Type: application/json' -d'
{
  "title": "Welcome to CRYB Platform",
  "content": "This is the first post on our new social platform combining the best of Reddit and Discord!",
  "authorUsername": "admin",
  "communityName": "announcements",
  "upvotes": 100,
  "downvotes": 5,
  "createdAt": "2025-10-01T00:00:00Z"
}'

curl -X POST "localhost:9200/posts/_doc/2" -H 'Content-Type: application/json' -d'
{
  "title": "How to use voice channels",
  "content": "Click on any voice channel to join and start talking with community members in real-time.",
  "authorUsername": "moderator",
  "communityName": "help",
  "upvotes": 75,
  "downvotes": 2,
  "createdAt": "2025-10-01T12:00:00Z"
}'

curl -X POST "localhost:9200/posts/_doc/3" -H 'Content-Type: application/json' -d'
{
  "title": "Community Guidelines",
  "content": "Please be respectful to all members and follow our community rules for a positive experience.",
  "authorUsername": "moderator",
  "communityName": "rules",
  "upvotes": 200,
  "downvotes": 10,
  "createdAt": "2025-10-01T06:00:00Z"
}'

# Index sample users
curl -X POST "localhost:9200/users/_doc/1" -H 'Content-Type: application/json' -d'
{
  "username": "admin",
  "email": "admin@cryb.network",
  "displayName": "Platform Admin",
  "bio": "Managing the CRYB platform",
  "createdAt": "2025-09-01T00:00:00Z"
}'

curl -X POST "localhost:9200/users/_doc/2" -H 'Content-Type: application/json' -d'
{
  "username": "testuser",
  "email": "test@example.com",
  "displayName": "Test User",
  "bio": "Just testing the platform",
  "createdAt": "2025-09-15T00:00:00Z"
}'

# Index sample communities
curl -X POST "localhost:9200/communities/_doc/1" -H 'Content-Type: application/json' -d'
{
  "name": "general",
  "description": "General discussion about anything and everything",
  "memberCount": 1000,
  "isPublic": true,
  "createdAt": "2025-09-01T00:00:00Z"
}'

curl -X POST "localhost:9200/communities/_doc/2" -H 'Content-Type: application/json' -d'
{
  "name": "gaming",
  "description": "All things gaming - PC, console, mobile",
  "memberCount": 500,
  "isPublic": true,
  "createdAt": "2025-09-10T00:00:00Z"
}'

# Refresh indices
curl -X POST "localhost:9200/_refresh" 2>/dev/null

echo ""
echo "✅ Sample data indexed successfully!"
echo ""

# Test search
echo "Testing search for 'platform':"
curl -s "localhost:9200/posts/_search?q=platform" | jq '.hits.total.value'