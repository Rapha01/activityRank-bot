.PHONY: up
up:
	docker compose up --build

.PHONY: up-prod
up-prod:
	npm run build
	docker compose -f docker-compose.prod.yml up --build

.PHONY: down
down: 
	docker compose down

