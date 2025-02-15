# TOEIC API Project

## Yêu cầu hệ thống deploy
- Docker
- Docker Compose
- Node.js v20.x (cho development)
- PostgreSQL (cho development local)

## môi trường development 
Nodejs V20.X
PostgreSQL 17 /pgadmin
npm version 9.X

## Cấu trúc project
```bash
toeic-api/
├── src/                    # Source code
├── dist/                   # Compiled files
├── docker/                 # Docker configurations
├── .env                    # Environment variables
├── .env.example           # Example environment file
├── docker-compose.yml     # Docker compose config
├── Dockerfile             # Docker build file
└── package.json           # Node.js dependencies
```

## Cách chạy dự án với Docker

### 1. Clone repository
```bash
git clone <repository-url>
cd toeic-api
```

### 2. Cấu hình môi trường
```bash
# Copy file môi trường mẫu
cp .env.example .env

# Chỉnh sửa các biến môi trường trong .env
nano .env
```

Các biến môi trường cần thiết:
```env
# Database
DB_HOST=db
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=toeic_db

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=86400

# Mail
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_USER=your_email
MAIL_PASSWORD=your_password

# AWS (nếu sử dụng)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
AWS_BUCKET_NAME=your_bucket
```

### 3. Khởi động dự án với Docker

#### Development Mode
```bash
# Build và start containers
docker-compose up -d

# Xem logs
docker-compose logs -f
```

Dockerfile cho development:
```dockerfile
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig*.json ./
COPY ormconfig.js ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
```

docker-compose.yml cho development:
```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: toeic-api
    ports:
      - "3000:3000"
    volumes:
      - .:/usr/src/app
      - /usr/src/app/node_modules
    environment:
      - NODE_ENV=development
      - DB_HOST=db
      - DB_PORT=5432
      - DB_USERNAME=${DB_USERNAME}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=${DB_NAME}
    depends_on:
      - db

  db:
    image: postgres:13-alpine
    container_name: toeic-db
    environment:
      - POSTGRES_USER=${DB_USERNAME}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=${DB_NAME}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 4. Các lệnh hữu ích

#### Docker Commands
```bash
# Stop containers
docker-compose down

# Rebuild và restart
docker-compose up -d --build

# Xem logs realtime
docker-compose logs -f

# Xem logs của service cụ thể
docker-compose logs -f api
docker-compose logs -f db
```

#### Database Commands
```bash
# Truy cập PostgreSQL shell
docker exec -it toeic-db psql -U postgres -d toeic_db

# Backup database
docker exec toeic-db pg_dump -U postgres toeic_db > backup.sql

# Restore database
cat backup.sql | docker exec -i toeic-db psql -U postgres toeic_db
```

#### Development Commands
```bash
# Install dependencies
npm install

# Run migrations
npm run migration:run

# Generate migration
npm run migration:generate --name=migration_name

# Revert migration
npm run migration:revert
```

## Troubleshooting

### 1. Database Connection Issues
```bash
# Check database logs
docker-compose logs db

# Verify database connection
docker exec toeic-db pg_isready -U postgres
```

### 2. API Issues
```bash
# Check API logs
docker-compose logs api

# Restart API service
docker-compose restart api
```

### 3. Permission Issues
```bash
# Fix permissions if needed
sudo chown -R $USER:$USER .
```

## API Documentation

### Authentication
- POST /api/auth/login
- POST /api/auth/register
- POST /api/auth/forgot-password
- POST /api/auth/reset-password

### Users
- GET /api/users/profile
- PUT /api/users/profile
- POST /api/users/change-password

### Tests
- GET /api/tests
- GET /api/tests/:id
- POST /api/tests
- PUT /api/tests/:id
- DELETE /api/tests/:id

## Contributing
1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request


