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
test -f .env || cp .env.example .env
```

Update `.env` with your PostgreSQL connection string:

```env
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:5432/DATABASE
```

The setup command above only copies `.env.example` if `.env` does not already
exist, so an existing local database configuration is not overwritten by
default.

The API always loads `apps/api/.env`, even if you start `uvicorn` from the repository
root. Values in `.env` override the defaults in `app/core/config.py`.

If you are using Neon or another hosted Postgres instance, make sure the database name
at the end of `DATABASE_URL` matches the actual database that contains your `users`
table and login data.

If you want the API to create the `users` and `products` tables automatically
from the SQLAlchemy models on startup, set:

```env
AUTO_CREATE_TABLES=true
```

## Run

```bash
cd apps/api
python -B -m uvicorn app.main:app --reload
```

The `-B` flag disables Python bytecode writes, so local runs do not generate
`__pycache__` directories or `.pyc` files in the repository.

## Available routes

- `GET /api/v1/health`
- `GET /api/v1/health/db`
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `GET /api/v1/products`
  - optional query params: `category`, `limit`, `offset`
- `GET /api/v1/products/{product_id}`
- `POST /api/v1/products`
- `GET /api/v1/orders?user_id=...`
- `POST /api/v1/orders`
