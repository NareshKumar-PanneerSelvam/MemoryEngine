# MemoryEngine Backend

FastAPI backend for MemoryEngine knowledge management system.

## Setup

1. Install Poetry (if not already installed):

```bash
curl -sSL https://install.python-poetry.org | python3 -
```

2. Install dependencies:

```bash
poetry install
```

3. Create `.env` file from template:

```bash
cp .env.example .env
```

4. Update `.env` with your configuration.

5. Run database migrations:

```bash
poetry run alembic upgrade head
```

6. Start development server:

```bash
poetry run uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

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
