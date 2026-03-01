# MemoryEngine

An AI-powered knowledge management system for structured learning and interview preparation in technical subjects.

## Overview

MemoryEngine helps you organize notes hierarchically, enhance content with AI, and master concepts through spaced repetition flashcards. Built with a modern tech stack and designed for both desktop and mobile use as a Progressive Web App.

## Features

- **Hierarchical Note Organization**: Organize notes in a tree structure with parent-child relationships
- **Dual-Mode Editor**: Toggle between rich text and Markdown editing modes
- **AI-Powered Content Enhancement**:
  - Rephrase, enhance, or simplify text
  - Generate interview questions from content
  - Auto-generate flashcards
  - Convert handwritten notes to Markdown via OCR
- **Spaced Repetition Flashcards**: Smart review scheduling based on your performance
- **Role-Based Access Control**: Admin and user roles with granular permissions
- **Selective Page Sharing**: Share specific pages with specific users (view-only or edit)
- **Advanced Search**: Search by page titles and content with smart prioritization
- **Progressive Web App**: Install on mobile devices with offline support
- **Mobile-First Design**: Optimized flashcard review with swipe gestures

## Tech Stack

### Frontend

- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- Tiptap (rich text editor)
- React Router (routing)
- Axios + React Query (data fetching)

### Backend

- FastAPI (Python web framework)
- SQLAlchemy (ORM)
- PostgreSQL (database)
- Alembic (migrations)
- JWT authentication
- Bcrypt (password hashing)
- Google Gemini API (AI features)

### Infrastructure

- **Database**: Supabase (managed PostgreSQL)
- **Backend Hosting**: Render
- **Frontend Hosting**: Vercel
- **AI Service**: Google Gemini API (free tier)

## Project Structure

```
memory-engine/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── core/           # Config, auth, database
│   │   ├── models/         # SQLAlchemy models
│   │   ├── routers/        # API endpoints
│   │   ├── services/       # Business logic
│   │   └── main.py         # FastAPI app
│   ├── alembic/            # Database migrations
│   ├── tests/              # Backend tests
│   ├── pyproject.toml      # Python dependencies
│   └── .env.example        # Environment variables template
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   ├── hooks/          # Custom hooks
│   │   ├── contexts/       # React contexts
│   │   ├── types/          # TypeScript types
│   │   └── App.tsx         # Main app component
│   ├── public/             # Static assets
│   ├── package.json        # Node dependencies
│   └── .env.example        # Environment variables template
│
├── .kiro/                  # Kiro spec files
│   └── specs/
│       └── memory-engine/
│           ├── requirements.md  # Requirements document
│           ├── design.md        # Design document
│           └── tasks.md         # Implementation tasks
│
└── README.md               # This file
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.11+
- Poetry (Python package manager)
- PostgreSQL (or Supabase account)
- Google Gemini API key

### Start Backend

```bash
cd backend

# one-time poetry install
curl -sSL https://install.python-poetry.org | python3 -
export PATH="$HOME/.local/bin:$PATH"

# project env
cp .env.example .env
# update DATABASE_URL, JWT_SECRET, GEMINI_API_KEY

# install deps + run
POETRY_VIRTUALENVS_IN_PROJECT=1 poetry install --no-root
POETRY_VIRTUALENVS_IN_PROJECT=1 poetry run alembic upgrade head
POETRY_VIRTUALENVS_IN_PROJECT=1 poetry run uvicorn app.main:app --reload
```

Backend: `http://localhost:8000`

Windows (PowerShell):

```powershell
cd backend

# one-time poetry install
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | py -
$env:Path += ";$HOME\\AppData\\Roaming\\Python\\Scripts"

Copy-Item .env.example .env
# update DATABASE_URL, JWT_SECRET, GEMINI_API_KEY

$env:POETRY_VIRTUALENVS_IN_PROJECT="1"
poetry install --no-root
poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload
```

### Start Frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:8000
npm install
npm run dev
```

Frontend: `http://localhost:5173`

Windows (PowerShell):

```powershell
cd frontend
Copy-Item .env.example .env
# VITE_API_URL=http://localhost:8000
npm install
npm run dev
```

### If `poetry: command not found`

```bash
export PATH="$HOME/.local/bin:$PATH"
```

To persist:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
```

Windows (PowerShell) temporary fix:

```powershell
$env:Path += ";$HOME\\AppData\\Roaming\\Python\\Scripts"
```

## Development Workflow

The project follows a spec-driven development approach. Implementation tasks are defined in `.kiro/specs/memory-engine/tasks.md`.

### Task Organization

Tasks are organized into 16 phases:

1. Project Setup
2. Database Setup
3. Authentication Backend
4. Authentication Frontend
5. Pages Backend API
6. Pages Frontend
7. Rich Text Editor
8. AI Service Backend
9. AI Features Frontend
10. Flashcards Backend
11. Flashcards Frontend
12. Search and Filtering
13. Admin Features
14. Error Handling and Logging
15. Progressive Web App
16. Deployment and Production

### Commit Convention

Each task includes a commit message following conventional commits:

- `feat:` - New features
- `fix:` - Bug fixes
- `chore:` - Maintenance tasks
- `docs:` - Documentation
- `test:` - Tests
- `refactor:` - Code refactoring

## API Documentation

Once the backend is running, visit:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Testing

### Backend Tests

```bash
cd backend
poetry run pytest
```

### Frontend Tests

```bash
cd frontend
npm run test
# or
yarn test
```

## Deployment

This stack supports free-tier deployment:
- Database: Supabase (Postgres)
- Backend: Render (free web service)
- Frontend: Vercel (free static hosting)

### 1) Database (Supabase)

1. Create a Supabase project.
2. Copy the Postgres connection string.
3. Set backend `DATABASE_URL` in this format:

```env
postgresql://postgres:YOUR_URL_ENCODED_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?sslmode=require
```

4. Run migrations against Supabase:

```bash
cd backend
cp .env.production.example .env.production
# fill values
POETRY_VIRTUALENVS_IN_PROJECT=1 poetry run alembic upgrade head
```

### 2) Backend (Render)

1. Connect repository in Render and create a Web Service.
2. Set Root Directory: `backend`
3. Build command:

```bash
POETRY_VIRTUALENVS_IN_PROJECT=1 poetry install --no-root && POETRY_VIRTUALENVS_IN_PROJECT=1 poetry run alembic upgrade head
```

4. Start command:

```bash
POETRY_VIRTUALENVS_IN_PROJECT=1 poetry run uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

5. Add env vars from `backend/.env.production.example`.
6. Set `CORS_ORIGINS` to include your frontend domain.

### 3) Frontend (Vercel)

1. Connect repository in Vercel.
2. Set Root Directory: `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Set `VITE_API_URL` to your Render backend URL (see `frontend/.env.production.example`).
6. Deploy.

### 4) Verify

1. Backend docs: `https://<backend-domain>/docs`
2. Frontend login, pages, users/admin flows
3. If API calls fail, verify `VITE_API_URL` and backend `CORS_ORIGINS`

## Environment Variables

### Backend

- `DATABASE_URL` - PostgreSQL connection string
- `GEMINI_API_KEY` - Google Gemini API key
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_ALGORITHM` - JWT algorithm (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Access token expiration (default: 30)
- `REFRESH_TOKEN_EXPIRE_DAYS` - Refresh token expiration (default: 7)
- `CORS_ORIGINS` - Allowed CORS origins (comma-separated)
- `ENVIRONMENT` - Environment name (`development` or `production`)
- Production template: `backend/.env.production.example`

### Frontend

- `VITE_API_URL` - Backend API URL
- Production template: `frontend/.env.production.example`

## Key Features Implementation

### Spaced Repetition Algorithm

- Easy: +7 days, +10 mastery
- Medium: +4 days, +5 mastery
- Hard: +2 days, -15 mastery
- High-mastery cards (≥80) get 2x interval on "Easy"

### Role-Based Access Control

- First user automatically becomes admin
- Admins can manage users and change roles
- Regular users have standard access

### Page Sharing

- Share specific pages with specific users
- Two permission levels: view_only and edit
- Owner can revoke access anytime
