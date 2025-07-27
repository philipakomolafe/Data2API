from fastapi import APIRouter, UploadFile, File, HTTPException
import os
import pandas as pd
import io 
import shutil
from typing import List 
from pathlib import Path
from supabase import Client, create_client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

router = APIRouter()

# Supabase Setup..
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)
BUCKET_NAME = "artifacts"

# # This gives the directory of the current script
# BASE_DIR = Path(__file__).resolve().parent / "artifacts"
# DATA_DIR = BASE_DIR / "data"
# MODEL_DIR = BASE_DIR / "model"

# # Ensure directories exist
# DATA_DIR.mkdir(parents=True, exist_ok=True)
# MODEL_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/")
async def upload(files: List[UploadFile] = File(...)):
    """
    Upload endpoint that stores files based on extension type.
    - .csv, .json, .xlsx go to /artifacts/data/
    - .pkl, .joblib, .onnx go to /artifacts/model/
    """
    saved_files_urls = []
    
    # Define mapping
    data_exts = {".csv", ".json", ".xlsx"}
    model_exts = {".pkl", ".joblib", ".onnx"}
    
    for file in files:
       filename = file.filename
       file_ext = Path(filename).suffix.lower()

       
       # Read file content
       contents = await file.read()

       # Reset file pointer to the beginning
       await file.seek(0)
    
       # Decide destination path
       if file_ext in data_exts:
           dest_folder = 'data'
           
           if file_ext == ".csv":
                try:
                    # Read CSV file.
                    df = pd.read_csv(io.BytesIO(contents))
                    # Convert dataframe to a list of dictionaries
                    records = df.to_dict(orient='records')
                    
                    # Prepare data for insertion, adding the source filename to each row
                    data_to_insert = [
                        {"source_filename": filename, "row_data": record}
                        for record in records
                    ]
                   
                    # Insert the records into the 'uploaded_data' table
                    supabase.table('uploaded_data').insert(data_to_insert).execute()
                except Exception as e:
                    raise HTTPException(status_code=500, detail=f"Failed to process and save CSV data: {e}")

       elif file_ext in model_exts:
           dest_folder = 'model'
       else:
           raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_ext}")

       # Final file path
       supabase_path = f"{dest_folder}/{filename}"


       # Save file to Supabase bucket
       try:
           supabase.storage.from_(BUCKET_NAME).upload(
               path=supabase_path,
               file=contents,
               file_options={"content-type": file.content_type}
           )
           # Get public URL for the uploaded file
           public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(supabase_path)
           saved_files_urls.append(public_url)
       except Exception as e:
           # Handle potential upload errors, e.g., file already exists
           # Supabase client might throw an error if file exists and upsert is not used.
           # For simplicity, we'll raise an HTTP exception.
           raise HTTPException(status_code=409, detail=f"Error uploading {filename}: {e}")

    return {
        "message": f"{len(saved_files_urls)} file(s) uploaded successfully.",
        "public_urls": saved_files_urls,
        "status": "uploaded"
    }
