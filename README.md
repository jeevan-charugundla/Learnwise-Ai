# LearnWise AI 🧠✨

<div align="center">

**An AI-powered learning platform with personalized tutoring, adaptive quizzing, and a conversational AI study buddy.**

FastAPI · React · Supabase · Groq LLM · Docker

</div>

---

LearnWise AI generates practice questions on any topic with Groq's LLM, evaluates student answers with detailed AI feedback, and adapts to learner performance — backed by a real-time AI assistant for explaining concepts.

## Features

- **AI-Powered Questions**: Automatically generates contextual questions using Groq's LLM
- **Answer Evaluation**: Intelligent evaluation of student answers with detailed feedback
- **Adaptive Learning**: Tracks progress and adjusts difficulty based on performance
- **Real-Time Chat**: Interactive AI assistant for answering questions and explaining concepts
- **Progress Analytics**: Comprehensive tracking of learning metrics and performance
- **Multi-Subject Support**: Mathematics, Physics, Chemistry, and more
- **Secure Authentication**: JWT-based auth with Supabase

> **Demo mode**: leave the Supabase/Groq credentials blank in `.env` and the app runs locally on **SQLite with no auth required** — great for trying it out with zero configuration.

## Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL via Supabase
- **AI/LLM**: Groq API
- **Auth**: Supabase Auth (JWT)
- **Deployment**: Docker

### Frontend
- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Build**: Vite
- **UI Components**: Lucide React icons
- **Charts**: Recharts
- **Client**: Supabase JS

## Project Structure

```
learnwise-ai/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py          # Configuration & environment
│   │   │   └── __init__.py
│   │   ├── services/
│   │   │   ├── questions.py       # Question generation logic
│   │   │   ├── analytics.py       # Progress tracking
│   │   │   └── __init__.py
│   │   ├── auth.py                # JWT verification
│   │   ├── groq_service.py        # Groq API integration
│   │   ├── db.py                  # Database utilities
│   │   ├── models.py              # SQLAlchemy models
│   │   ├── schemas.py             # Pydantic schemas
│   │   └── main.py                # FastAPI application
│   ├── supabase/
│   │   └── migrations/
│   │       ├── 001_initial_schema.sql    # Tables & schema
│   │       ├── 002_auth_and_rls.sql      # Auth & RLS policies
│   │       └── 003_seed_data.sql         # Sample data
│   ├── tests/
│   │   ├── test_analytics.py
│   │   └── test_api.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api.ts                 # API client with auth
│   │   ├── supabase.ts            # Supabase client setup
│   │   ├── App.tsx                # Main application component
│   │   ├── types.ts               # TypeScript interfaces
│   │   ├── styles.css             # Global styles
│   │   └── main.tsx               # React entry point
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── .env.example
├── docker-compose.yml
└── README.md
```

## Getting Started

### Prerequisites

- Docker & Docker Compose (for local Supabase)
- Node.js 18+ (frontend)
- Python 3.10+ (backend)
- npm or yarn (frontend package manager)

### Backend Setup

1. **Clone and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your Supabase credentials and Groq API key:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_service_key
   GROQ_API_KEY=your_groq_api_key
   JWT_SECRET=your_jwt_secret
   ```

5. **Initialize database (if using local Supabase):**
   ```bash
   # Start Supabase locally
   docker-compose up -d
   
   # Run migrations
   psql -h localhost -U postgres -d postgres -f supabase/migrations/001_initial_schema.sql
   psql -h localhost -U postgres -d postgres -f supabase/migrations/002_auth_and_rls.sql
   psql -h localhost -U postgres -d postgres -f supabase/migrations/003_seed_data.sql
   ```

6. **Start backend server:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

Backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_API_URL=http://localhost:8000/api
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

Frontend will be available at `http://localhost:5173`

## API Endpoints

### Health Check
- `GET /api/health` - Health check endpoint

### Topics & Resources
- `GET /api/topics?subject_id={id}` - Get topics for a subject
- `GET /api/resources?topic_id={id}` - Get learning resources for a topic

### Questions
- `POST /api/questions/generate` - Generate a question
  ```json
  {
    "topic_id": "string",
    "difficulty": "easy | medium | hard"
  }
  ```
- `POST /api/questions/evaluate` - Evaluate an answer
  ```json
  {
    "question_id": "string",
    "answer": "string"
  }
  ```

### Progress
- `GET /api/progress?user_id={id}` - Get user learning progress

### Chat
- `POST /api/chat/stream` - Stream AI chat response
  ```json
  {
    "topic_id": "string",
    "message": "string"
  }
  ```

## Database Schema

### Core Tables
- **users** - User accounts (via Supabase Auth)
- **subjects** - Learning subjects
- **topics** - Topics within subjects
- **resources** - Learning materials
- **questions** - Generated/stored questions
- **answers** - User answers to questions
- **progress** - User learning progress
- **chat_history** - Conversation history

All tables include Row Level Security (RLS) policies to ensure users can only access their own data.

## Authentication

The platform uses JWT tokens issued by Supabase Auth:

1. User signs up/logs in through the frontend
2. Supabase issues a JWT token
3. Frontend includes token in `Authorization: Bearer <token>` header
4. Backend verifies token in `auth.py` middleware
5. Token is refreshed automatically by Supabase client

## AI Integration

### Question Generation
- Uses Groq API with LLaMA models
- Generates contextual questions based on topic
- Difficulty levels: easy, medium, hard

### Answer Evaluation
- AI-powered evaluation with reasoning
- Generates detailed feedback
- Scoring based on correctness and completeness

### Chat Assistance
- Real-time conversational AI
- Streaming responses for better UX
- Context-aware answers based on selected topic

## Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Frontend Build Check
```bash
cd frontend
npm run build
```

## Deployment

### Docker Deployment
```bash
docker-compose up -d
```

This starts:
- Supabase (PostgreSQL + Auth)
- Backend (FastAPI on port 8000)
- Frontend (Vite dev server on port 5173)

### Production Build
```bash
# Backend
docker build -t learnwise-backend ./backend

# Frontend
npm run build
```

## Environment Variables

### Backend (.env)
```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
GROQ_API_KEY=
JWT_SECRET=
DATABASE_URL=
```

### Frontend (.env)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=http://localhost:8000/api
```

## Features Roadmap

- [ ] Video content integration
- [ ] Adaptive difficulty scaling
- [ ] Social learning features
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Gamification (badges, leaderboards)
- [ ] Teacher dashboard
- [ ] Batch question generation
- [ ] Custom curriculum support

## Troubleshooting

### Backend Connection Issues
- Ensure Supabase is running: `docker ps`
- Check .env variables are set correctly
- Verify JWT_SECRET is configured

### Frontend API Errors
- Check VITE_API_URL is correct
- Verify Supabase credentials in .env
- Check browser console for CORS errors

### Database Migration Errors
- Ensure PostgreSQL is running
- Check migration file syntax
- Verify user permissions

## Contributing

1. Create a feature branch
2. Make changes and test
3. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the development team.

---

**Made with ❤️ by the LearnWise Team**
