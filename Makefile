# Khởi động services
up:
	docker-compose up -d

# Xem logs
logs:
	docker-compose logs -f

# Dừng services
down:
	docker-compose down

# Dừng và xóa volumes (nếu muốn reset database)
down-volumes:
	docker-compose down -v

# Database operations
seed:
	npm run seed-user-pass

# Chạy ứng dụng (Development)
dev:
	npm run dev