.PHONY: setup up down build seed logs shell db-studio

setup: ## First-time setup: copy .env, build, and start
	@test -f .env || cp .env.example .env
	@echo "✓ .env created — edit NEXTAUTH_SECRET and POSTGRES_PASSWORD before deploying"
	$(MAKE) up

up: ## Start all services
	docker compose up -d

down: ## Stop all services
	docker compose down

build: ## Rebuild the app image
	docker compose build --no-cache app

seed: ## Seed the database with sample data
	docker compose exec app sh -c "cd /app && npx ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts"

logs: ## Follow app logs
	docker compose logs -f app

shell: ## Open a shell in the app container
	docker compose exec app sh

db-studio: ## Open Prisma Studio (local dev only)
	npx prisma studio

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'
