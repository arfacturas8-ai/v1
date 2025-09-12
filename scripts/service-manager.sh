#!/bin/bash

# CRYB Platform Service Manager
# Manages all services (PM2 Node.js apps and Docker containers) with 24/7 persistence

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}[$(date '+%Y-%m-%d %H:%M:%S')] ${message}${NC}"
}

# Function to check service health
check_service_health() {
    local service_name=$1
    local url=$2
    local timeout=${3:-5}
    
    if curl -s --max-time $timeout "$url" >/dev/null 2>&1; then
        print_status $GREEN "✓ $service_name is responding"
        return 0
    else
        print_status $RED "✗ $service_name is not responding"
        return 1
    fi
}

# Function to check PM2 services
check_pm2_services() {
    print_status $BLUE "=== PM2 Services Status ==="
    
    if ! command -v pm2 &> /dev/null; then
        print_status $RED "PM2 is not installed"
        return 1
    fi
    
    pm2 status
    
    # Check API health
    sleep 2
    check_service_health "CRYB API" "http://localhost:3001/health" 10
    
    # Check Web health
    check_service_health "CRYB Web" "http://localhost:3000" 10
}

# Function to check Docker services
check_docker_services() {
    print_status $BLUE "=== Docker Services Status ==="
    
    if ! command -v docker &> /dev/null; then
        print_status $RED "Docker is not installed"
        return 1
    fi
    
    # Check essential Docker services
    local essential_services=(
        "cryb-postgres-dev:5433:PostgreSQL"
        "cryb-redis-dev:6380:Redis"
        "cryb-elasticsearch:9201:Elasticsearch"
        "cryb-minio:9000:MinIO"
        "cryb-livekit-dev:7880:LiveKit"
    )
    
    for service_info in "${essential_services[@]}"; do
        IFS=':' read -r container_name port service_name <<< "$service_info"
        
        if docker ps --format "table {{.Names}}" | grep -q "$container_name"; then
            status=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep "$container_name" | awk '{print $2}')
            if [[ "$status" == "Up" ]]; then
                print_status $GREEN "✓ $service_name container is running"
                
                # Test service connectivity where applicable
                case $service_name in
                    "PostgreSQL")
                        if pg_isready -h localhost -p $port -U cryb_user >/dev/null 2>&1; then
                            print_status $GREEN "  ✓ PostgreSQL is accepting connections"
                        else
                            print_status $YELLOW "  ! PostgreSQL container running but not ready"
                        fi
                        ;;
                    "Redis")
                        if redis-cli -h localhost -p $port ping >/dev/null 2>&1; then
                            print_status $GREEN "  ✓ Redis is responding to ping"
                        else
                            print_status $YELLOW "  ! Redis container running but not ready"
                        fi
                        ;;
                    "Elasticsearch")
                        check_service_health "  Elasticsearch API" "http://localhost:$port/_cluster/health" 5
                        ;;
                    "MinIO")
                        check_service_health "  MinIO API" "http://localhost:$port/minio/health/live" 5
                        ;;
                    "LiveKit")
                        check_service_health "  LiveKit API" "http://localhost:$port" 5
                        ;;
                esac
            else
                print_status $RED "✗ $service_name container exists but is not running ($status)"
            fi
        else
            print_status $RED "✗ $service_name container not found"
        fi
    done
}

# Function to start all services
start_all_services() {
    print_status $BLUE "=== Starting All Services ==="
    
    # Start Docker services first
    print_status $YELLOW "Starting essential Docker services..."
    cd /home/ubuntu/cryb-platform
    docker-compose up -d postgres redis elasticsearch minio livekit
    
    # Wait for Docker services to be ready
    print_status $YELLOW "Waiting for Docker services to initialize..."
    sleep 10
    
    # Start PM2 services
    print_status $YELLOW "Starting PM2 services..."
    pm2 start ecosystem.config.js
    
    print_status $GREEN "All services started. Checking health in 15 seconds..."
    sleep 15
    
    check_all_services
}

# Function to stop all services
stop_all_services() {
    print_status $BLUE "=== Stopping All Services ==="
    
    # Stop PM2 services
    print_status $YELLOW "Stopping PM2 services..."
    pm2 stop all
    
    # Stop Docker services
    print_status $YELLOW "Stopping Docker services..."
    cd /home/ubuntu/cryb-platform
    docker-compose stop
    
    print_status $GREEN "All services stopped"
}

# Function to restart all services
restart_all_services() {
    print_status $BLUE "=== Restarting All Services ==="
    stop_all_services
    sleep 5
    start_all_services
}

# Function to check all services
check_all_services() {
    print_status $BLUE "=== CRYB Platform Service Health Check ==="
    check_pm2_services
    echo ""
    check_docker_services
    echo ""
    print_status $BLUE "=== Health Check Complete ==="
}

# Function to monitor services continuously
monitor_services() {
    print_status $BLUE "=== Starting Service Monitor (press Ctrl+C to stop) ==="
    
    while true; do
        clear
        check_all_services
        print_status $YELLOW "Next check in 30 seconds..."
        sleep 30
    done
}

# Function to setup service persistence
setup_persistence() {
    print_status $BLUE "=== Setting Up Service Persistence ==="
    
    # Ensure PM2 startup is configured
    print_status $YELLOW "Configuring PM2 startup..."
    pm2 save
    
    # Ensure Docker is enabled
    print_status $YELLOW "Ensuring Docker starts at boot..."
    sudo systemctl enable docker
    
    # Show current startup configuration
    print_status $GREEN "Startup configuration complete:"
    echo "  - PM2 processes saved and will auto-start at boot"
    echo "  - Docker service enabled to start at boot"
    echo "  - Docker containers have 'restart: unless-stopped' policy"
    echo "  - Systemd backup service files available in /home/ubuntu/cryb-platform/systemd/"
}

# Function to show logs
show_logs() {
    local service=$1
    case $service in
        "api")
            pm2 logs cryb-api
            ;;
        "web")
            pm2 logs cryb-web
            ;;
        "pm2")
            pm2 logs
            ;;
        "docker")
            docker-compose logs -f --tail=50
            ;;
        *)
            print_status $RED "Invalid service. Options: api, web, pm2, docker"
            ;;
    esac
}

# Main script logic
case "${1:-status}" in
    "start")
        start_all_services
        ;;
    "stop")
        stop_all_services
        ;;
    "restart")
        restart_all_services
        ;;
    "status"|"check")
        check_all_services
        ;;
    "monitor")
        monitor_services
        ;;
    "setup")
        setup_persistence
        ;;
    "logs")
        show_logs $2
        ;;
    "help"|"--help"|"-h")
        echo "CRYB Platform Service Manager"
        echo ""
        echo "Usage: $0 [COMMAND] [OPTIONS]"
        echo ""
        echo "Commands:"
        echo "  start    - Start all services (Docker + PM2)"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  status   - Check health of all services (default)"
        echo "  monitor  - Continuously monitor service health"
        echo "  setup    - Configure service persistence for 24/7 operation"
        echo "  logs     - Show logs (api|web|pm2|docker)"
        echo "  help     - Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 status          # Check all services"
        echo "  $0 monitor         # Monitor services continuously"
        echo "  $0 logs api        # Show API logs"
        echo "  $0 restart         # Restart everything"
        ;;
    *)
        print_status $RED "Unknown command: $1"
        print_status $YELLOW "Use '$0 help' for usage information"
        exit 1
        ;;
esac