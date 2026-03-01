# MemoryEngine Backend

FastAPI backend for MemoryEngine knowledge management system.

## Quick Start

### 1) Prerequisites

- Python 3.11+
- PostgreSQL running locally (or remote connection string)
- Poetry

### 2) Install Poetry (if missing)

```bash
curl -sSL https://install.python-poetry.org | python3 -
export PATH="$HOME/.local/bin:$PATH"
poetry --version
```

Windows (PowerShell):

```powershell
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | py -
$env:Path += ";$HOME\\AppData\\Roaming\\Python\\Scripts"
poetry --version
```

If `poetry` works only after `export PATH=...`, add this to your shell profile:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
```

### 3) Configure environment

```bash
cd backend
cp .env.example .env
```

Windows (PowerShell):

```powershell
cd backend
Copy-Item .env.example .env
```

Update `.env` with at least:

```env
DATABASE_URL=postgresql://admin:password@localhost:5432/memoryengine
JWT_SECRET=dev-secret-key
GEMINI_API_KEY=dev-gemini-api-key
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 4) Install dependencies

Use in-project virtualenv to avoid permission issues on some systems:

```bash
POETRY_VIRTUALENVS_IN_PROJECT=1 poetry install --no-root
```

Windows (PowerShell):

```powershell
$env:POETRY_VIRTUALENVS_IN_PROJECT="1"
poetry install --no-root
```

Optional (make this permanent for this repo):

```bash
poetry config virtualenvs.in-project true --local
```

### 5) Run migrations

```bash
POETRY_VIRTUALENVS_IN_PROJECT=1 poetry run alembic upgrade head
```

Windows (PowerShell):

```powershell
$env:POETRY_VIRTUALENVS_IN_PROJECT="1"
poetry run alembic upgrade head
```

### 6) Start server

```bash
POETRY_VIRTUALENVS_IN_PROJECT=1 poetry run uvicorn app.main:app --reload
```

Windows (PowerShell):

```powershell
$env:POETRY_VIRTUALENVS_IN_PROJECT="1"
poetry run uvicorn app.main:app --reload
```

Backend will be available at `http://localhost:8000`.

## Common Issues

### `poetry: command not found`

Install Poetry, then add it to PATH:

```bash
curl -sSL https://install.python-poetry.org | python3 -
export PATH="$HOME/.local/bin:$PATH"
```

Windows (PowerShell):

```powershell
$env:Path += ";$HOME\\AppData\\Roaming\\Python\\Scripts"
```

### Migration/DB connection errors

- Ensure PostgreSQL is running
- Verify `DATABASE_URL` in `.env`
- Re-run:

```bash
POETRY_VIRTUALENVS_IN_PROJECT=1 poetry run alembic upgrade head
```

## API Documentation

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Testing

Run tests:

```bash
poetry run pytest
```

Run tests with coverage:

```bash
poetry run pytest --cov=app
```

## Project Structure

```
backend/
├── app/
│   ├── core/          # Configuration and core utilities
│   ├── models/        # SQLAlchemy models
│   ├── routers/       # API endpoints
│   ├── services/      # Business logic
│   └── main.py        # FastAPI application
├── alembic/           # Database migrations
├── tests/             # Test files
└── pyproject.toml     # Dependencies
```
