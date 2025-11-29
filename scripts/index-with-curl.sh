#!/bin/bash

echo "🔍 Indexing data into Elasticsearch..."

# Get all posts from database
psql -h localhost -p 5433 -U cryb_user -d cryb -t -A -F'|' <<EOF | while IFS='|' read -r id title content score
SELECT id, title, content, score FROM "Post" LIMIT 100;
EOF
do
  # Escape JSON characters
  title=$(echo "$title" | sed 's/"/\\"/g')
  content=$(echo "$content" | sed 's/"/\\"/g')
  
  # Index each post
  curl -s -X POST "localhost:9200/posts/_doc/$id" \
    -H 'Content-Type: application/json' \
    -d "{
      \"title\": \"$title\",
      \"content\": \"$content\",
      \"score\": $score,
      \"type\": \"post\"
    }" > /dev/null 2>&1
done

echo "✅ Posts indexed"

# Get all users
psql -h localhost -p 5433 -U cryb_user -d cryb -t -A -F'|' <<EOF | while IFS='|' read -r id username displayName
SELECT id, username, "displayName" FROM "User" LIMIT 100;
EOF
do
  # Escape JSON characters
  username=$(echo "$username" | sed 's/"/\\"/g')
  displayName=$(echo "$displayName" | sed 's/"/\\"/g')
  
  # Index each user
  curl -s -X POST "localhost:9200/users/_doc/$id" \
    -H 'Content-Type: application/json' \
    -d "{
      \"username\": \"$username\",
      \"displayName\": \"$displayName\",
      \"type\": \"user\"
    }" > /dev/null 2>&1
done

echo "✅ Users indexed"

# Get all communities
psql -h localhost -p 5433 -U cryb_user -d cryb -t -A -F'|' <<EOF | while IFS='|' read -r id name displayName description
SELECT id, name, "displayName", description FROM "Community" LIMIT 100;
EOF
do
  # Escape JSON characters
  name=$(echo "$name" | sed 's/"/\\"/g')
  displayName=$(echo "$displayName" | sed 's/"/\\"/g')
  description=$(echo "$description" | sed 's/"/\\"/g')
  
  # Index each community
  curl -s -X POST "localhost:9200/communities/_doc/$id" \
    -H 'Content-Type: application/json' \
    -d "{
      \"name\": \"$name\",
      \"displayName\": \"$displayName\",
      \"description\": \"$description\",
      \"type\": \"community\"
    }" > /dev/null 2>&1
done

echo "✅ Communities indexed"

# Test search
echo ""
echo "Testing search..."
curl -s "localhost:9200/posts/_search?q=demo" | jq '.hits.total.value'