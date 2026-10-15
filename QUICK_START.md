# LearnWise AI - Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Backend Setup (2 minutes)

```powershell
cd backend

# Create virtual environment
python -m venv .venv
.\.venv\Scripts\Activate

# Install dependencies
pip install -r requirements.txt

# Verify your .env file has:
# - SUPABASE_URL
# - SUPABASE_SERVICE_KEY  
# - GROQ_API_KEY
# - JWT_SECRET
# - DATABASE_URL

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be at: **http://localhost:8000**
API Docs at: **http://localhost:8000/docs**

### Step 2: Frontend Setup (2 minutes)

In another terminal:

```powershell
cd frontend

# Install dependencies
npm install

# Verify your .env file has:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - VITE_API_URL=http://localhost:8000/api

# Start dev server
npm run dev
```

Frontend will be at: **http://localhost:5173**

### Step 3: Database Setup (1 minute)

If using **local Supabase** via Docker:

```powershell
# In project root
docker-compose up -d

# Wait 30 seconds for Supabase to start, then run migrations
# Use psql or your Supabase CLI to apply:
# - supabase/migrations/001_initial_schema.sql
# - supabase/migrations/002_auth_and_rls.sql
# - supabase/migrations/003_seed_data.sql
```

If using **Supabase Cloud**, run the migration files in the Supabase SQL editor.

---

## 📝 First Time Use

1. Go to **http://localhost:5173**
2. Click **Sign Up**
3. Enter email: `test@example.com`
4. Enter password: `testpass123`
5. Click **Sign Up**
6. Select a subject (Math, Physics, Chemistry)
7. Select a topic
8. Click **Generate Question**
9. Type your answer
10. Click **Submit Answer**
11. Try the **AI Chat** tab

---

## 🧪 Testing

### Backend Tests
```powershell
cd backend
python -m pytest tests/ -v
```

### Frontend Build
```powershell
cd frontend
npm run build
```

---

## 🔧 Troubleshooting

### Port Already in Use
```powershell
# Kill process on port 8000
Get-Process | Where-Object { $_.Id -eq (Get-NetTCPConnection -LocalPort 8000).OwningProcess } | Stop-Process -Force
```

### Environment Variables Not Loaded
- Delete `.venv` and recreate
- Verify `.env` file exists in backend/ and frontend/
- Restart the server

### Supabase Connection Error
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in .env
- Verify Supabase is running if using Docker
- Test connection: `psql -h localhost -U postgres`

### Frontend Not Connecting to Backend
- Ensure backend is running on port 8000
- Check `VITE_API_URL` in frontend/.env
- Check browser console for CORS errors

---

## 📚 Next Steps

1. **Review the API**: http://localhost:8000/docs
2. **Check the README**: `README.md`
3. **Read the implementation status**: `IMPLEMENTATION_STATUS.md`
4. **Explore the code**:
   - Backend: `backend/app/main.py`
   - Frontend: `frontend/src/App.tsx`

---

## 🎯 Features Currently Available

- ✅ User signup/login
- ✅ Subject & topic browsing
- ✅ Question generation (backend only - frontend UI ready)
- ✅ Answer evaluation (backend only - frontend UI ready)
- ✅ Chat interface (frontend UI ready)
- ✅ Progress tracking (backend only)
- ✅ Resource viewing

---

**Questions?** Check the README.md or IMPLEMENTATION_STATUS.md for more details.
