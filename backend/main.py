from fastapi import FastAPI
from api import upload, auth # adjust this path to your actual file

app = FastAPI()
app.include_router(upload.router, prefix="/upload", tags=["upload"])

app.include_router(auth.router, prefix="/auth")
