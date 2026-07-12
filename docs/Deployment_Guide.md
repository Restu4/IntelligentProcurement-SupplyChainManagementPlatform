# Deployment Guide
## SmartProcure AI — Production Deployment

---

## 1. Prerequisites

| Requirement | Version |
|-------------|---------|
| Python | 3.12+ |
| PostgreSQL | 16+ |
| Node.js | 20+ (LTS) |
| npm/yarn | Latest |
| Git | Latest |

---

## 2. Backend Deployment

### 2.1 Environment Setup
```bash
# Clone repository
git clone <repository-url>
cd smartprocure/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# OR
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt
```

### 2.2 Database Setup
```bash
# Create PostgreSQL database
createdb smartprocure

# Copy environment config
cp .env.example .env

# Edit .env with your values
# DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/smartprocure
# JWT_SECRET_KEY=<generate-random-secret>
# GEMINI_API_KEY=<your-gemini-api-key>
```

### 2.3 Run Migrations
```bash
# Auto-create tables (first run)
python main.py  # Tables created automatically on startup

# OR use Alembic
alembic upgrade head
```

### 2.4 Seed Knowledge Base
```bash
# Copy existing documents
cp ../data/*.txt knowledge_base/

# Run seed script
python seed_knowledge_base.py
```

### 2.5 Start Server
```bash
# Development
python main.py

# Production with Gunicorn
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

### 2.6 Docker Deployment
```dockerfile
# Dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: smartprocure
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql+asyncpg://postgres:postgres@db:5432/smartprocure
      JWT_SECRET_KEY: your-secret-key
      GEMINI_API_KEY: your-gemini-key
    depends_on:
      - db
    volumes:
      - ./uploads:/app/uploads
      - ./vectordb:/app/vectordb

volumes:
  postgres_data:
```

---

## 3. Frontend Deployment

### 3.1 Setup
```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm start
```

### 3.2 Environment Variables
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3.3 Docker Deployment
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 4. Mobile App Deployment

### 4.1 Flutter Setup
```bash
cd mobile

# Get dependencies
flutter pub get

# Build APK (Android)
flutter build apk --release

# Build IPA (iOS)
flutter build ios --release
```

---

## 5. Production Checklist

- [ ] Set strong `JWT_SECRET_KEY` (32+ random characters)
- [ ] Configure `GEMINI_API_KEY` from Google AI Studio
- [ ] Enable HTTPS with reverse proxy (Nginx/Caddy)
- [ ] Set `DEBUG=False` in production
- [ ] Configure PostgreSQL connection pooling
- [ ] Set up regular database backups
- [ ] Monitor with logging (ELK/DataDog)
- [ ] Configure CORS properly for production domain
- [ ] Set rate limiting for API endpoints
- [ ] Enable health check monitoring

---

## 6. Nginx Reverse Proxy Configuration

```nginx
server {
    listen 80;
    server_name smartprocure.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
