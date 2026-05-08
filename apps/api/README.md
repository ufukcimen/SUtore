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
pip install -e .
test -f .env || cp .env.example .env
```

On Windows PowerShell:

```powershell
cd apps/api
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e .
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
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

To email invoice PDFs automatically after checkout, also configure SMTP in
`apps/api/.env`. The same SMTP transport is used for password reset emails:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_USE_TLS=true
SMTP_USE_SSL=false
MAIL_FROM_EMAIL=billing@example.com
MAIL_FROM_NAME=SUtore Billing
FRONTEND_BASE_URL=http://localhost:5173
PASSWORD_RESET_TOKEN_MINUTES=60
PASSWORD_RESET_MAIL_FROM_NAME=SUtore Support
```

If SMTP is not configured, the order is still created successfully and the API
skips invoice email delivery. Password reset requests still return a generic
success response, but no email can be sent until SMTP is configured.

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

From the repository root, `npm.cmd run dev:api` on Windows or `npm run dev:api`
on macOS/Linux starts the same server through the project launcher.

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
- `GET /api/v1/admin/invoices/pdf?admin_user_id=...`
- `GET /api/v1/admin/invoices/{order_id}/pdf?admin_user_id=...`
- `GET /api/v1/manager/deliveries?manager_user_id=...`
- `PATCH /api/v1/manager/deliveries/{delivery_id}/in-transit`
- `PATCH /api/v1/manager/deliveries/{delivery_id}/complete`
