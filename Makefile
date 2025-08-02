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

# Seed admin account only
seed-admin:
	node scripts/seed-admin.js

# Quick database reset (for development)
reset-db:
	node scripts/reset-db-quick.js

# Chạy ứng dụng (Development)
dev:
	npm run dev