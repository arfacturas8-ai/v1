#!/bin/bash
# Fix duplicate style attributes by keeping only the second one
find src -name "*.jsx" -type f | while read file; do
  # Fix: style={{...}} style={{...}} -> keep second
  sed -i 's/style={{\([^}]*\)}} style={{\([^}]*\)}}/style={{\2}}/g' "$file"
  
  # Fix: className="..." className="..." -> merge
  sed -i 's/className="\([^"]*\)" className="\([^"]*\)"/className="\1 \2"/g' "$file"
done
echo "Duplicate attributes fixed"
