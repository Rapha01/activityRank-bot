.PHONY: up
up:
	docker-compose up -d

.PHONY: up-prod
up-prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up

.PHONY: down
down: 
	docker-compose down

