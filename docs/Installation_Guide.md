# Installation Guide
## SmartProcure AI — Local Development Setup

---

## 1. System Requirements

| Requirement | Minimum Specification |
|-------------|----------------------|
| Processor | Intel Core i5 / AMD Ryzen 5 |
| RAM | 8 GB (16 GB recommended) |
| Storage | 5 GB free space |
| OS | Windows 10+, macOS 12+, Ubuntu 20.04+ |
| Internet | Required for LLM API calls |

---

## 2. Prerequisites Installation

### 2.1 Python 3.12+
**Windows:**
```bash
# Download from python.org or use winget
winget install Python.Python.3.12
```

**macOS:**
```bash
brew install python@3.12
```

**Ubuntu:**
```bash
sudo apt update
sudo apt install python3.12 python3.12-venv python3-pip
```

### 2.2 PostgreSQL 16
**Windows:**
```bash
# Download from postgresql.org or use winget
winget install PostgreSQL.PostgreSQL.16
```

**macOS:**
```bash
brew install postgresql@16
```

**Ubuntu:**
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2.3 Node.js 20+
```bash
# Windows/macOS/Linux
# Download from nodejs.org or use nvm
nvm install 20
nvm use 20
```

### 2.4 Flutter SDK
```bash
# Download from flutter.dev
# Or use:
git clone https://github.com/flutter/flutter.git -b stable
# Add to PATH
```

---

## 3. Backend Installation

### 3.1 Clone & Setup
```bash
git clone <repository-url>
cd smartprocure/backend

# Create virtual environment
python -m venv venv

# Activate
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3.2 Database Setup
```bash
# Create database
createdb smartprocure

# Or via psql
psql -U postgres -c "CREATE DATABASE smartprocure;"
```

### 3.3 Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/smartprocure
JWT_SECRET_KEY=your-super-secret-key-change-this
GEMINI_API_KEY=AIzaSy...
```

### 3.4 Get Gemini API Key
1. Visit: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy and paste into `.env`

### 3.5 Run Backend
```bash
python main.py
# Server starts at http://localhost:8000
# Swagger UI: http://localhost:8000/docs
```

### 3.6 Seed Knowledge Base
```bash
python seed_knowledge_base.py
```

---

## 4. Frontend Installation

### 4.1 Setup
```bash
cd frontend
npm install
```

### 4.2 Configure
```bash
# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

### 4.3 Run
```bash
npm run dev
# Frontend starts at http://localhost:3000
```

---

## 5. Mobile App Setup

### 5.1 Dependencies
```bash
cd mobile
flutter pub get
```

### 5.2 Run
```bash
# For web (testing)
flutter run -d chrome

# For Android emulator
flutter run

# For iOS simulator (macOS only)
flutter run -d ios
```

---

## 6. Verification Checklist

- [ ] `http://localhost:8000/api/health` returns healthy status
- [ ] `http://localhost:8000/docs` shows Swagger UI
- [ ] `http://localhost:3000` shows login page
- [ ] Login with `admin` / `admin123` works
- [ ] AI Chat responds to questions
- [ ] Document upload processes correctly
- [ ] Suppliers page loads data
- [ ] Forecast API returns predictions

---

## 7. Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 8000 in use | Change port: `python main.py` or kill process |
| Database connection error | Check PostgreSQL is running and `.env` is correct |
| Gemini API error | Verify `GEMINI_API_KEY` in `.env` |
| Module not found | Run `pip install -r requirements.txt` |
| ChromaDB error | Check write permissions for `vectordb/` directory |
