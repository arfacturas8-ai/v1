#!/bin/bash
# Quick sync script for individual agents

AGENT=$1
BRANCH="agent/$AGENT"

if [ -z "$AGENT" ]; then
  echo "Usage: ./sync_my_work.sh [backend|frontend|platform|quality|web3|design|realtime]"
  exit 1
fi

echo "🔄 Syncing $AGENT work..."

# Ensure we're on the right branch
git checkout "$BRANCH"

# Add all changes
git add -A

# Commit with timestamp
TASK=$(jq -r ".agents.$AGENT.current_task" agent_state.json)
git commit -m "$AGENT - $TASK [$(date +%H:%M)]"

# Try to merge to main
git checkout main
git pull origin main

if git merge "$BRANCH" --no-ff -m "🔀 Merge $AGENT work"; then
  echo "✅ Merged successfully"
  git push origin main
else
  echo "⚠️ Conflict detected - needs manual resolution"
  git merge --abort
  git checkout "$BRANCH"
fi

# Return to agent branch
git checkout "$BRANCH"

echo "✅ Sync complete for $AGENT"