#!/bin/bash

echo "Indexing data into Elasticsearch..."

# Get data from PostgreSQL
POSTS=$(PGPASSWORD=cryb_password psql -h localhost -p 5433 -U cryb_user -d cryb -t -A -c "SELECT json_agg(row_to_json(p)) FROM (SELECT id, title, content, score FROM \"Post\" LIMIT 100) p")

# Index posts
if [ ! -z "$POSTS" ] && [ "$POSTS" != "null" ]; then
  echo "$POSTS" | jq -c '.[]' | while read post; do
    id=$(echo "$post" | jq -r '.id')
    curl -s -X PUT "localhost:9200/posts/_doc/$id" \
      -H "Content-Type: application/json" \
      -d "$post" > /dev/null
    echo -n "."
  done
  echo ""
fi

# Get users  
USERS=$(PGPASSWORD=cryb_password psql -h localhost -p 5433 -U cryb_user -d cryb -t -A -c "SELECT json_agg(row_to_json(u)) FROM (SELECT id, username, \"displayName\" FROM \"User\" LIMIT 100) u")

# Index users
if [ ! -z "$USERS" ] && [ "$USERS" != "null" ]; then
  echo "$USERS" | jq -c '.[]' | while read user; do
    id=$(echo "$user" | jq -r '.id')
    curl -s -X PUT "localhost:9200/users/_doc/$id" \
      -H "Content-Type: application/json" \
      -d "$user" > /dev/null
    echo -n "."
  done
  echo ""
fi

# Get communities
COMMUNITIES=$(PGPASSWORD=cryb_password psql -h localhost -p 5433 -U cryb_user -d cryb -t -A -c "SELECT json_agg(row_to_json(c)) FROM (SELECT id, name, description FROM \"Community\" LIMIT 100) c")

# Index communities
if [ ! -z "$COMMUNITIES" ] && [ "$COMMUNITIES" != "null" ]; then
  echo "$COMMUNITIES" | jq -c '.[]' | while read community; do
    id=$(echo "$community" | jq -r '.id')
    curl -s -X PUT "localhost:9200/communities/_doc/$id" \
      -H "Content-Type: application/json" \
      -d "$community" > /dev/null
    echo -n "."
  done
  echo ""
fi

echo "Indexing complete!"

# Show counts
echo "Posts indexed: $(curl -s localhost:9200/posts/_count | jq .count)"
echo "Users indexed: $(curl -s localhost:9200/users/_count | jq .count)"
echo "Communities indexed: $(curl -s localhost:9200/communities/_count | jq .count)"