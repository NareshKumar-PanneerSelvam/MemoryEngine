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

### Backend Setup

1. Navigate to backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
poetry install
```

3. Create `.env` file from template:

```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/memoryengine
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_secret_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=http://localhost:5173
```

5. Run database migrations:

```bash
poetry run alembic upgrade head
```

6. Start development server:

```bash
poetry run uvicorn app.main:app --reload
```

Backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Create `.env` file from template:

```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:

```env
VITE_API_URL=http://localhost:8000
```

5. Start development server:

```bash
npm run dev
# or
yarn dev
```

Frontend will be available at `http://localhost:5173`

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

### Database (Supabase)

1. Create a Supabase project
2. Get connection string from project settings
3. Run migrations against Supabase database

### Backend (Render)

1. Connect GitHub repository to Render
2. Create new Web Service
3. Configure build command: `poetry install && poetry run alembic upgrade head`
4. Configure start command: `poetry run uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Set environment variables

### Frontend (Vercel)

1. Connect GitHub repository to Vercel
2. Configure build settings (Vite)
3. Set `VITE_API_URL` environment variable
4. Deploy

## Environment Variables

### Backend

- `DATABASE_URL` - PostgreSQL connection string
- `GEMINI_API_KEY` - Google Gemini API key
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_ALGORITHM` - JWT algorithm (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Access token expiration (default: 30)
- `REFRESH_TOKEN_EXPIRE_DAYS` - Refresh token expiration (default: 7)
- `CORS_ORIGINS` - Allowed CORS origins (comma-separated)

### Frontend

- `VITE_API_URL` - Backend API URL

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
