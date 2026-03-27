# SUtore

Tech-parts e-commerce course project split into a React frontend and a FastAPI
backend.

## Structure

- `apps/web`: React, Tailwind, Axios, React Router frontend
- `apps/api`: FastAPI, SQLAlchemy, PostgreSQL backend

## Frontend

From the repository root:

```bash
npm install
npm run dev:web
```

Build the frontend:

```bash
npm run build:web
```

## Backend

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -e .
cp .env.example .env
cd ../..
npm run dev:api
```

Set `DATABASE_URL` in `apps/api/.env` to point at your PostgreSQL instance.
The backend dev script runs Python with `-B`, which prevents `__pycache__` and
`.pyc` files from being written into the repository during normal local runs.
