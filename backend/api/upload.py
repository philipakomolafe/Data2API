import os
import json
from typing import List
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Header
from supabase import Client, create_client
from dotenv import load_dotenv


# Load environment variables from .env file
load_dotenv()

router = APIRouter()

# --- Supabase Setup ---
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)
BUCKET_NAME = "artifacts"

# --- Authentication Dependency ---
async def get_current_user(authorization: str = Header(...)):
    """Dependency to get user from JWT in Authorization header."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization scheme.")
    token = authorization.split(" ")[1]
    try:
        # This validates the token and returns the user
        user_response = supabase.auth.get_user(token)
        return user_response.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token or user not found.")

@router.post("/")
async def upload(
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Uploads files directly to storage and records metadata.
    Requires authentication.
    """
    saved_files_urls = []
    user_id = current_user.id

    # Define mapping
    data_exts = {".csv", '.tsv', ".json", ".xlsx", '.jsonl', '.parquet', '.xml'}
    model_exts = {".pkl", ".joblib", ".onnx", '.h5', '.pth', '.pt', '.safetensors', '.keras'}

    for file in files:
        filename = file.filename
        file_ext = Path(filename).suffix.lower()

        if file_ext in data_exts:
            dest_folder = "data"
        elif file_ext in model_exts:
            dest_folder = "model"
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_ext}")

        supabase_path = f"{dest_folder}/{filename}"
        
        try:
            # 1. Upload the file to storage
            contents = await file.read()
            supabase.storage.from_(BUCKET_NAME).upload(
                path=supabase_path,
                file=contents,
                file_options={"content-type": file.content_type, "upsert": "true"}
            )

            # 2. Record metadata in the database
            supabase.table('file_metadata').upsert({
                "storage_path": supabase_path,
                "filename": filename,
                "uploader_user_id": user_id,
                "content_type": file.content_type
            }, on_conflict="storage_path").execute()

            public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(supabase_path)
            saved_files_urls.append(public_url)

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing {filename}: {e}")

    return {
        "message": f"{len(saved_files_urls)} file(s) uploaded successfully.",
        "public_urls": saved_files_urls,
        'status': 'uploaded'
    }

@router.get("/my-files")
async def get_my_files(current_user: dict = Depends(get_current_user)):
    """Retrieves a list of files uploaded by the authenticated user."""
    user_id = current_user.id
    try:
        response = supabase.table('file_metadata').select('*').eq('uploader_user_id', user_id).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not retrieve files: {e}")