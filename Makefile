.PHONY: help install dev build test clean docker-up docker-down docker-reset db-setup

# Colors for output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(CYAN)CRYB Platform Development Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

install: ## Install all dependencies
	@echo "$(YELLOW)Installing dependencies...$(NC)"
	pnpm install
	@echo "$(GREEN)Dependencies installed!$(NC)"

dev: docker-check ## Start development environment
	@echo "$(YELLOW)Starting development environment...$(NC)"
	@make docker-up
	@sleep 5
	@make db-setup
	@echo "$(GREEN)Starting application...$(NC)"
	pnpm dev

build: ## Build all packages
	@echo "$(YELLOW)Building packages...$(NC)"
	pnpm build
	@echo "$(GREEN)Build complete!$(NC)"

test: ## Run tests
	@echo "$(YELLOW)Running tests...$(NC)"
	pnpm test
	@echo "$(GREEN)Tests complete!$(NC)"

lint: ## Run linting
	@echo "$(YELLOW)Running linter...$(NC)"
	pnpm lint
	@echo "$(GREEN)Linting complete!$(NC)"

format: ## Format code
	@echo "$(YELLOW)Formatting code...$(NC)"
	pnpm format
	@echo "$(GREEN)Formatting complete!$(NC)"

clean: ## Clean build artifacts and node_modules
	@echo "$(YELLOW)Cleaning...$(NC)"
	rm -rf node_modules
	rm -rf apps/*/node_modules
	rm -rf packages/*/node_modules
	rm -rf apps/*/dist
	rm -rf packages/*/dist
	rm -rf .turbo
	rm -rf .next
	@echo "$(GREEN)Clean complete!$(NC)"

# Docker commands
docker-check: ## Check if Docker is installed
	@which docker > /dev/null 2>&1 || (echo "$(RED)Docker is not installed. Please install Docker first.$(NC)" && exit 1)
	@which docker-compose > /dev/null 2>&1 || which docker > /dev/null 2>&1 || (echo "$(RED)Docker Compose is not installed. Please install Docker Compose first.$(NC)" && exit 1)

docker-up: docker-check ## Start Docker services
	@echo "$(YELLOW)Starting Docker services...$(NC)"
	docker compose up -d postgres redis elasticsearch minio
	@echo "$(GREEN)Docker services started!$(NC)"
	@echo "Services running:"
	@echo "  - PostgreSQL: localhost:5432"
	@echo "  - Redis: localhost:6379"
	@echo "  - Elasticsearch: localhost:9200"
	@echo "  - MinIO: localhost:9000 (Console: localhost:9001)"

docker-down: ## Stop Docker services
	@echo "$(YELLOW)Stopping Docker services...$(NC)"
	docker compose down
	@echo "$(GREEN)Docker services stopped!$(NC)"

docker-reset: ## Reset Docker services and volumes
	@echo "$(RED)WARNING: This will delete all data!$(NC)"
	@read -p "Are you sure? (y/N) " -n 1 -r; \
	echo ""; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "$(YELLOW)Resetting Docker services...$(NC)"; \
		docker compose down -v; \
		echo "$(GREEN)Docker services reset!$(NC)"; \
	else \
		echo "$(YELLOW)Cancelled$(NC)"; \
	fi

docker-logs: ## Show Docker logs
	docker compose logs -f

docker-ps: ## Show Docker container status
	docker compose ps

# Database commands
db-setup: ## Setup database schema
	@echo "$(YELLOW)Setting up database...$(NC)"
	@cd packages/database && pnpm prisma generate
	@cd packages/database && pnpm prisma db push
	@echo "$(GREEN)Database setup complete!$(NC)"

db-migrate: ## Run database migrations
	@echo "$(YELLOW)Running migrations...$(NC)"
	@cd packages/database && pnpm prisma migrate dev
	@echo "$(GREEN)Migrations complete!$(NC)"

db-seed: ## Seed database with sample data
	@echo "$(YELLOW)Seeding database...$(NC)"
	@cd packages/database && pnpm prisma db seed
	@echo "$(GREEN)Database seeded!$(NC)"

db-studio: ## Open Prisma Studio
	@echo "$(YELLOW)Opening Prisma Studio...$(NC)"
	@cd packages/database && pnpm prisma studio

db-reset: ## Reset database
	@echo "$(RED)WARNING: This will delete all data!$(NC)"
	@read -p "Are you sure? (y/N) " -n 1 -r; \
	echo ""; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "$(YELLOW)Resetting database...$(NC)"; \
		cd packages/database && pnpm prisma migrate reset --force; \
		echo "$(GREEN)Database reset!$(NC)"; \
	else \
		echo "$(YELLOW)Cancelled$(NC)"; \
	fi

# Monitoring commands
monitoring-up: ## Start monitoring services
	@echo "$(YELLOW)Starting monitoring services...$(NC)"
	docker compose --profile monitoring up -d
	@echo "$(GREEN)Monitoring services started!$(NC)"
	@echo "Services running:"
	@echo "  - Prometheus: http://localhost:9090"
	@echo "  - Grafana: http://localhost:3002 (admin/admin123)"
	@echo "  - Jaeger: http://localhost:16686"
	@echo "  - Kibana: http://localhost:5601"

monitoring-down: ## Stop monitoring services
	@echo "$(YELLOW)Stopping monitoring services...$(NC)"
	docker compose --profile monitoring down
	@echo "$(GREEN)Monitoring services stopped!$(NC)"

# Tool commands
tools-up: ## Start development tools
	@echo "$(YELLOW)Starting development tools...$(NC)"
	docker compose --profile tools up -d
	@echo "$(GREEN)Development tools started!$(NC)"
	@echo "Tools running:"
	@echo "  - Redis Commander: http://localhost:8081"
	@echo "  - pgAdmin: http://localhost:5050 (admin@cryb.ai/admin123)"

tools-down: ## Stop development tools
	@echo "$(YELLOW)Stopping development tools...$(NC)"
	docker compose --profile tools down
	@echo "$(GREEN)Development tools stopped!$(NC)"

# Production commands
prod-build: ## Build for production
	@echo "$(YELLOW)Building for production...$(NC)"
	NODE_ENV=production pnpm build
	@echo "$(GREEN)Production build complete!$(NC)"

prod-start: ## Start production server
	@echo "$(YELLOW)Starting production server...$(NC)"
	NODE_ENV=production pnpm start
	@echo "$(GREEN)Production server started!$(NC)"

# Utility commands
env-check: ## Check environment variables
	@echo "$(CYAN)Checking environment variables...$(NC)"
	@[ -f .env ] && echo "$(GREEN)✓ .env file exists$(NC)" || echo "$(RED)✗ .env file missing$(NC)"
	@[ -f .env.local ] && echo "$(GREEN)✓ .env.local file exists$(NC)" || echo "$(YELLOW)! .env.local file missing (optional)$(NC)"
	@echo ""
	@echo "$(CYAN)Required variables:$(NC)"
	@[ -n "$${DATABASE_URL}" ] && echo "$(GREEN)✓ DATABASE_URL$(NC)" || echo "$(RED)✗ DATABASE_URL$(NC)"
	@[ -n "$${REDIS_URL}" ] && echo "$(GREEN)✓ REDIS_URL$(NC)" || echo "$(RED)✗ REDIS_URL$(NC)"
	@[ -n "$${JWT_SECRET}" ] && echo "$(GREEN)✓ JWT_SECRET$(NC)" || echo "$(RED)✗ JWT_SECRET$(NC)"

logs: ## Show application logs
	@echo "$(CYAN)Showing application logs...$(NC)"
	pnpm dev 2>&1 | tee app.log

status: ## Show system status
	@echo "$(CYAN)System Status$(NC)"
	@echo ""
	@echo "$(YELLOW)Docker Services:$(NC)"
	@docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
	@echo ""
	@echo "$(YELLOW)Node Version:$(NC)"
	@node --version
	@echo ""
	@echo "$(YELLOW)pnpm Version:$(NC)"
	@pnpm --version

# Quick start command
quickstart: install docker-up db-setup ## Quick start for new developers
	@echo "$(GREEN)✨ CRYB Platform is ready!$(NC)"
	@echo ""
	@echo "Run '$(CYAN)make dev$(NC)' to start the development server"
	@echo ""
	@echo "Available URLs:"
	@echo "  - Web App: http://localhost:3000"
	@echo "  - API: http://localhost:3001"
	@echo "  - Prisma Studio: Run '$(CYAN)make db-studio$(NC)'"
	@echo ""
	@echo "For more commands, run '$(CYAN)make help$(NC)'"