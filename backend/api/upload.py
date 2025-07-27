import json
import os
import pandas as pd
import io 
import shutil
from typing import List 
from pathlib import Path
from supabase import Client, create_client
from dotenv import load_dotenv
from fastapi import APIRouter, UploadFile, File, HTTPException

# Load environment variables from .env file
load_dotenv()

router = APIRouter()

# Supabase Setup..
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)
BUCKET_NAME = "artifacts"



@router.post("/")
async def upload(files: List[UploadFile] = File(...)):
    """
    Upload endpoint that stores files based on extension type.
    - .csv, .json, .xlsx go to /artifacts/data/
    - .pkl, .joblib, .onnx go to /artifacts/model/
    """
    saved_files_urls = []
    
    # Define mapping
    data_exts = {".csv", '.tsv', ".json", ".xlsx", '.jsonl', '.parquet', '.xml'}
    model_exts = {".pkl", ".joblib", ".onnx", '.h5', '.pth', '.pt', '.safetensors', '.keras'}
    
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
           records_to_insert = []

           try:
               # Logic to parse file based on extension
               if file_ext in ['.csv', '.tsv']:
                   df = pd.read_csv(io.BytesIO(contents))
                   df = df.where(pd.notna(df), None) 
                   # Convert datetimes to ISO format strings during JSON conversion
                   json_string = df.to_json(orient='records', date_format='iso')
                   records_to_insert = json.loads(json_string)


               elif file_ext == '.xlsx':
                   # Note: This reads the first sheet by default
                   df = pd.read_excel(io.BytesIO(contents), engine='openpyxl')
                   df = df.where(pd.notna(df), None) 
                   # Convert datetimes to ISO format strings during JSON conversion
                   json_string = df.to_json(orient='records', date_format='iso')
                   records_to_insert = json.loads(json_string)

               elif file_ext == '.json':
                   # Assumes the JSON file contains a list of objects
                   json_data = json.loads(contents)
                   if isinstance(json_data, list):
                       records_to_insert = json_data
                   else: # Handle case where JSON is a single object
                       records_to_insert = [json_data]
               
               elif file_ext == '.jsonl':
                   # Reads each line as a separate JSON object
                   records_to_insert = [json.loads(line) for line in io.BytesIO(contents).readlines()]

               elif file_ext == '.parquet':
                   df = pd.read_parquet(io.BytesIO(contents), engine='pyarrow')
                   df = df.where(pd.notna(df), None)
                   # Convert datetimes to ISO format strings during JSON conversion
                   json_string = df.to_json(orient='records', date_format='iso')
                   records_to_insert = json.loads(json_string)

               # If we have records, insert them into the database
               if records_to_insert:
                   data_to_insert = [
                       {"source_filename": filename, "row_data": record}
                       for record in records_to_insert
                   ]
                   supabase.table('uploaded_data').insert(data_to_insert).execute()

           except Exception as e:
               raise HTTPException(status_code=500, detail=f"Failed to process and save {file_ext} data: {e}")


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
