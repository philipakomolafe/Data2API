from fastapi import FastAPI
from api import upload  # adjust this path to your actual file

app = FastAPI()
app.include_router(upload.router, prefix="/upload", tags=["upload"])
