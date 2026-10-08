.PHONY: up down bash logs restart

up:
	docker compose --env-file .docker/.env.docker.dev up -d --build

down:
	docker compose --env-file .docker/.env.docker.dev down

bash:
	docker exec -it radarpartners-front bash

logs:
	docker compose --env-file .docker/.env.docker.dev logs -f radarpartners-front

restart: down up
