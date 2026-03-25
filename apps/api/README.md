# SUtore API

FastAPI backend wired to PostgreSQL with SQLAlchemy models for the existing
`users` and `products` tables.

## Structure

- `app/api/v1/endpoints`: route modules
- `app/core`: settings and password hashing
- `app/db`: SQLAlchemy engine, session, and metadata
- `app/models`: ORM models
- `app/schemas`: request and response schemas

## Setup

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -e .
cp .env.example .env
```

Update `.env` with your PostgreSQL connection string:

```env
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:5432/DATABASE
```

If you want the API to create the `users` and `products` tables automatically
from the SQLAlchemy models on startup, set:

```env
AUTO_CREATE_TABLES=true
```

## Run

```bash
cd apps/api
uvicorn app.main:app --reload
```

## Available routes

- `GET /api/v1/health`
- `GET /api/v1/health/db`
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `GET /api/v1/products`
- `GET /api/v1/products/{product_id}`
- `POST /api/v1/products`
