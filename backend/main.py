from fastapi import FastAPI
from api import upload, auth
from pipelines import infer_pipeline

app = FastAPI()

# Include the router from Upload.py
app.include_router(upload.router, prefix="/upload", tags=["File Operations"])

# Include new router instance from Auth.py
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Include the pipelines router...
app.include_router(infer_pipeline.router, prefix='/pipelines', tags=['Pipelines'])