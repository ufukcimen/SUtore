from fastapi import FastAPI

from . import models
from .database import Base, engine

app = FastAPI()


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.get("/")
def read_root():
    return {"message": "Backend is running"}
