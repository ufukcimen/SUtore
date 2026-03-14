# API Placeholder

This directory is reserved for the FastAPI application so the repository already matches a production-style split:

- `apps/web`: React + Tailwind frontend
- `apps/api`: FastAPI service

Suggested backend ownership for your teammate:

- `app/api/v1/endpoints`: route modules
- `app/core`: settings, security, shared config
- `app/db`: database session and migrations entrypoints
- `app/models`: SQLAlchemy models
- `app/schemas`: Pydantic schemas
- `app/services`: business logic

No backend code was implemented in this task.

