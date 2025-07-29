from fastapi import FastAPI
from api import upload, auth # adjust this path to your actual file

app = FastAPI()

# Include the router from Upload.py
app.include_router(upload.router, prefix="/upload", tags=["upload"])

# Include new router instance from Auth.py 
app.include_rounter(auth.router, prefix="/auth")