.PHONY: up
up:
	docker compose up --build

.PHONY: up-prod
up-prod:
	docker compose -f docker-compose.prod.yml up --build

.PHONY: down
down: 
	docker compose down

