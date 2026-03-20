.PHONY: setup dev test seed docker-up clean

setup:          ## Primera vez: levantar todo
	cp backend/.env.example backend/.env
	cp web/.env.example web/.env
	cp mobile/.env.example mobile/.env
	docker-compose up -d postgres redis
	sleep 3
	cd backend && pip install -r requirements.txt
	cd backend && python -m app.utils.seed_data
	cd web && npm install
	@echo "Setup completo. Ejecuta 'make dev' para iniciar."

dev:            ## Iniciar en desarrollo
	docker-compose up -d postgres redis
	cd backend && uvicorn app.main:app --reload --port 8000 &
	cd web && npm run dev &

test:           ## Correr todos los tests
	cd backend && pytest app/tests/ -v --asyncio-mode=auto

seed:           ## Re-poblar datos demo
	cd backend && python -m app.utils.seed_data

docker-up:      ## Levantar todo con Docker
	docker-compose up --build

clean:          ## Limpiar contenedores y volumenes
	docker-compose down -v
