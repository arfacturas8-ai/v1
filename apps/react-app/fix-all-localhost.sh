#!/bin/bash

echo "Fixing all hardcoded localhost:3002 references..."

# Create backup
cp -r src src.backup.$(date +%Y%m%d_%H%M%S)

# Replace all localhost:3002 references with environment variables
find src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i \
  -e "s|'http://localhost:3002/api/v1'|import.meta.env.VITE_API_URL \|\| 'https://api.cryb.ai/api/v1'|g" \
  -e "s|'http://localhost:3002'|import.meta.env.VITE_API_URL?.replace('/api/v1', '') \|\| 'https://api.cryb.ai'|g" \
  -e "s|\"http://localhost:3002/api/v1\"|import.meta.env.VITE_API_URL \|\| 'https://api.cryb.ai/api/v1'|g" \
  -e "s|\"http://localhost:3002\"|import.meta.env.VITE_API_URL?.replace('/api/v1', '') \|\| 'https://api.cryb.ai'|g" \
  -e "s|'ws://localhost:3002'|import.meta.env.VITE_WS_URL \|\| 'wss://api.cryb.ai'|g" \
  -e "s|\"ws://localhost:3002\"|import.meta.env.VITE_WS_URL \|\| 'wss://api.cryb.ai'|g" \
  {} \;

echo "Fixed all references. Files modified:"
find src -type f \( -name "*.js" -o -name "*.jsx" \) -exec grep -l "localhost:3002" {} \; 2>/dev/null

echo "Remaining localhost references (should be 0):"
grep -r "localhost:3002" src --include="*.js" --include="*.jsx" 2>/dev/null | wc -l