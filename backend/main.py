from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import upload, auth
from pipelines import infer_pipeline

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routers from API files
app.include_router(upload.router, prefix="/upload", tags=["File Operations"])
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(infer_pipeline.router, prefix='/pipelines', tags=['Pipelines'])