from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

engine_kwargs = {"pool_pre_ping": True}

if settings.database_url.startswith("postgresql"):
    # The hosted demo database can reject bursts of new SSL connections. Keep
    # local dev requests on a small reusable pool instead of opening many at once.
    engine_kwargs.update(
        pool_size=5,
        max_overflow=0,
        pool_timeout=60,
        pool_recycle=1800,
        connect_args={"connect_timeout": 10},
    )

engine = create_engine(settings.database_url, **engine_kwargs)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
