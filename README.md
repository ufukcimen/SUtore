# SUtore

Tech-parts e-commerce course project split into a React frontend and a FastAPI backend.

## Structure

- `apps/web`: React, Tailwind, Axios, React Router frontend
- `apps/api`: FastAPI, SQLAlchemy, PostgreSQL backend

## Getting started

### 1. First-time setup (after cloning)

Installs npm packages, creates the Python venv, installs API dependencies, and copies `.env.example` to `.env`:

```bash
npm run setup
```

Then set `DATABASE_URL` in `apps/api/.env` to point at your PostgreSQL instance.

### 2. Run the project

Pick whichever you prefer — they all do the same thing (start backend + frontend together and open the browser):

```bash
npm start              # standard npm convention
npm run sutore         # branded alias
npm run dev            # explicit dev script
```

Backend runs on `http://localhost:8000`, frontend on `http://localhost:5173`. The browser opens automatically. Press `Ctrl+C` once to stop both servers.

### 3. (Optional) Type just `sutore` from anywhere

Run this once from the repo root to install `sutore` as a global command:

```bash
npm link
```

Now from any directory:

```bash
sutore
```

To uninstall the global command later: `npm unlink -g sutore`.

## Manual commands

```bash
npm run dev:web      # frontend only (with auto-open browser)
npm run dev:api      # backend only
npm run build:web    # production build of frontend
npm run preview:web  # preview production build
npm run test:web     # frontend tests
npm run test:api     # backend tests (pytest)
```

## Original manual setup (if `npm run setup` doesn't work)

```bash
# frontend
npm install

# backend
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -e .
test -f .env || cp .env.example .env
cd ../..
```

The backend dev script runs Python with `-B`, which prevents `__pycache__` and
`.pyc` files from being written into the repository during normal local runs.
