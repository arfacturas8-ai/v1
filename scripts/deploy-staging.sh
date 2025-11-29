#!/bin/bash

# ==============================================
# CRYB PLATFORM - STAGING DEPLOYMENT SCRIPT
# ==============================================
# Automated staging deployment with health checks
# ==============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Configuration
STAGING_HOST="${STAGING_HOST:-staging.cryb.ai}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
DEPLOYMENT_ID="${DEPLOYMENT_ID:-$(date +%s)}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ✅ $1"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ⚠️  $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ❌ $1"
    exit 1
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."
    
    # Check if required environment variables are set
    local required_vars=("AWS_ACCESS_KEY_ID" "AWS_SECRET_ACCESS_KEY")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            error "Required environment variable $var is not set"
        fi
    done
    
    # Check AWS connectivity
    if ! aws sts get-caller-identity &>/dev/null; then
        error "Unable to connect to AWS. Check credentials."
    fi
    
    success "Pre-deployment checks passed"
}

# Update staging configuration
update_staging_config() {
    log "Updating staging configuration..."
    
    # Create staging-specific environment file
    cat > "$PROJECT_ROOT/.env.staging" << EOF
NODE_ENV=staging
API_URL=https://api-staging.cryb.ai
WEB_URL=https://staging.cryb.ai
DATABASE_URL=\${STAGING_DATABASE_URL}
REDIS_URL=\${STAGING_REDIS_URL}
IMAGE_TAG=${IMAGE_TAG}
DEPLOYMENT_ID=${DEPLOYMENT_ID}
EOF
    
    success "Staging configuration updated"
}

# Deploy to AWS ECS/EKS
deploy_to_aws() {
    log "Deploying to AWS staging environment..."
    
    # Update ECS task definition with new image
    local task_definition=$(aws ecs describe-task-definition \
        --task-definition cryb-staging \
        --query 'taskDefinition' \
        --output json)
    
    # Update image tags
    local updated_task_definition=$(echo "$task_definition" | jq \
        --arg IMAGE_TAG "$IMAGE_TAG" \
        '.containerDefinitions[0].image = "ghcr.io/cryb-platform/cryb-api:" + $IMAGE_TAG |
         .containerDefinitions[1].image = "ghcr.io/cryb-platform/cryb-web:" + $IMAGE_TAG |
         del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .placementConstraints, .compatibilities, .registeredAt, .registeredBy)')
    
    # Register new task definition
    local new_task_def=$(echo "$updated_task_definition" | aws ecs register-task-definition \
        --cli-input-json file:///dev/stdin \
        --query 'taskDefinition.taskDefinitionArn' \
        --output text)
    
    # Update service
    aws ecs update-service \
        --cluster cryb-staging \
        --service cryb-staging-service \
        --task-definition "$new_task_def" \
        --force-new-deployment
    
    success "Deployment initiated"
}

# Wait for deployment to complete
wait_for_deployment() {
    log "Waiting for deployment to complete..."
    
    local max_wait=600  # 10 minutes
    local wait_interval=30
    local elapsed=0
    
    while [[ $elapsed -lt $max_wait ]]; do
        local deployment_status=$(aws ecs describe-services \
            --cluster cryb-staging \
            --services cryb-staging-service \
            --query 'services[0].deployments[0].status' \
            --output text)
        
        if [[ "$deployment_status" == "PRIMARY" ]]; then
            success "Deployment completed successfully"
            return 0
        elif [[ "$deployment_status" == "FAILED" ]]; then
            error "Deployment failed"
        fi
        
        log "Deployment status: $deployment_status. Waiting..."
        sleep $wait_interval
        elapsed=$((elapsed + wait_interval))
    done
    
    error "Deployment timed out after $max_wait seconds"
}

# Run health checks
run_health_checks() {
    log "Running health checks..."
    
    local endpoints=(
        "https://api-staging.cryb.ai/health"
        "https://staging.cryb.ai"
    )
    
    for endpoint in "${endpoints[@]}"; do
        log "Checking $endpoint..."
        
        local max_retries=5
        local retry=0
        
        while [[ $retry -lt $max_retries ]]; do
            if curl -sf "$endpoint" >/dev/null; then
                success "$endpoint is healthy"
                break
            fi
            
            retry=$((retry + 1))
            if [[ $retry -eq $max_retries ]]; then
                error "$endpoint failed health check"
            fi
            
            sleep 10
        done
    done
    
    success "All health checks passed"
}

# Update load balancer
update_load_balancer() {
    log "Updating load balancer configuration..."
    
    # Update Application Load Balancer target group
    local target_group_arn=$(aws elbv2 describe-target-groups \
        --names cryb-staging-targets \
        --query 'TargetGroups[0].TargetGroupArn' \
        --output text)
    
    # The ECS service will automatically register new tasks
    log "Load balancer will be updated automatically by ECS"
    
    success "Load balancer configuration updated"
}

# Send deployment notification
send_notification() {
    local status="$1"
    local message="$2"
    
    if [[ -n "${SLACK_WEBHOOK:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 Staging Deployment: $status\\n$message\\nImage Tag: $IMAGE_TAG\"}" \
            "$SLACK_WEBHOOK"
    fi
    
    log "Notification sent: $status - $message"
}

# Rollback function
rollback_deployment() {
    log "Rolling back deployment..."
    
    # Get previous task definition
    local previous_task_def=$(aws ecs list-task-definitions \
        --family-prefix cryb-staging \
        --status ACTIVE \
        --sort DESC \
        --max-items 2 \
        --query 'taskDefinitionArns[1]' \
        --output text)
    
    if [[ -n "$previous_task_def" ]]; then
        # Update service to previous task definition
        aws ecs update-service \
            --cluster cryb-staging \
            --service cryb-staging-service \
            --task-definition "$previous_task_def"
        
        success "Rollback initiated"
    else
        error "No previous task definition found for rollback"
    fi
}

# Main execution
main() {
    echo "🚀 Starting CRYB Platform Staging Deployment"
    echo "============================================="
    echo ""
    echo "Image Tag: $IMAGE_TAG"
    echo "Deployment ID: $DEPLOYMENT_ID"
    echo "Target Host: $STAGING_HOST"
    echo ""
    
    # Set up error handling
    trap 'error "Deployment failed"; rollback_deployment; send_notification "FAILED" "Staging deployment failed and rolled back"' ERR
    
    pre_deployment_checks
    update_staging_config
    deploy_to_aws
    wait_for_deployment
    update_load_balancer
    run_health_checks
    
    success "Staging deployment completed successfully!"
    send_notification "SUCCESS" "Staging deployment completed successfully"
    
    echo ""
    echo "🔗 Staging URLs:"
    echo "  • Web App: https://staging.cryb.ai"
    echo "  • API: https://api-staging.cryb.ai"
    echo "  • Health: https://api-staging.cryb.ai/health"
    echo ""
}

# Execute main function with all arguments
main "$@"