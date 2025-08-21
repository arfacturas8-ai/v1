#!/bin/bash
# CRYB Platform - Master Orchestrator
# Coordinates 7 agent windows working in parallel

# Configuration
REPO_PATH="/home/ubuntu/cryb-platform"
MAIN_BRANCH="main"
BACKUP_PATH="/home/ubuntu/backups/cryb-$(date +%Y%m%d)"

# Agent branches (each window works on its own branch)
declare -A AGENT_BRANCHES=(
  ["backend"]="agent/backend"
  ["frontend"]="agent/frontend"
  ["platform"]="agent/platform"
  ["quality"]="agent/quality"
  ["web3"]="agent/web3"
  ["design"]="agent/design"
  ["realtime"]="agent/realtime"
)

# Initialize branches for each agent
init_branches() {
  echo "🔄 Initializing agent branches..."
  cd "$REPO_PATH"
  
  for agent in "${!AGENT_BRANCHES[@]}"; do
    branch="${AGENT_BRANCHES[$agent]}"
    
    # Create branch if doesn't exist
    if ! git show-ref --verify --quiet "refs/heads/$branch"; then
      git checkout -b "$branch"
      echo "✅ Created branch: $branch"
    fi
  done
  
  git checkout "$MAIN_BRANCH"
}

# Merge all agent work periodically
merge_agent_work() {
  echo "🔀 Merging agent work..."
  cd "$REPO_PATH"
  
  # First, ensure main is up to date
  git checkout "$MAIN_BRANCH"
  
  # Merge each agent's branch
  for agent in "${!AGENT_BRANCHES[@]}"; do
    branch="${AGENT_BRANCHES[$agent]}"
    
    echo "Merging $branch..."
    
    # Try to merge
    if git merge "$branch" --no-ff -m "🤖 [AUTO] Merge $agent team work"; then
      echo "✅ Merged $branch successfully"
    else
      echo "⚠️ Conflict in $branch - needs manual resolution"
      git merge --abort
    fi
  done
  
  # Push to remote
  git push origin "$MAIN_BRANCH"
}

# Backup system
create_backup() {
  echo "💾 Creating backup..."
  
  # Create backup directory
  mkdir -p "$BACKUP_PATH"
  
  # Copy entire project
  cp -r "$REPO_PATH" "$BACKUP_PATH/"
  
  # Also create a git bundle
  cd "$REPO_PATH"
  git bundle create "$BACKUP_PATH/cryb-$(date +%H%M%S).bundle" --all
  
  echo "✅ Backup created at $BACKUP_PATH"
}

# Continuous monitoring loop
monitor_loop() {
  while true; do
    echo "$(date): Orchestrator cycle starting..."
    
    # Every 30 minutes: merge work
    merge_agent_work
    
    # Every hour: create backup
    if [ $(date +%M) -eq "00" ]; then
      create_backup
    fi
    
    # Update the state file with git stats
    update_git_stats
    
    # Sleep for 30 minutes
    sleep 1800
  done
}

# Update git statistics in state file
update_git_stats() {
  cd "$REPO_PATH"
  
  # Count commits today
  commits_today=$(git log --since="midnight" --oneline | wc -l)
  
  # Update agent_state.json
  jq ".git_commits_today = $commits_today" agent_state.json > tmp.json && mv tmp.json agent_state.json
  
  echo "📊 Git stats updated: $commits_today commits today"
}

# Main execution
main() {
  echo "🚀 CRYB Orchestrator Started"
  echo "Managing 7 agent windows..."
  
  # Initialize
  init_branches
  
  # Start monitoring
  monitor_loop
}

main