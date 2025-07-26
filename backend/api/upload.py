from fastapi import APIRouter, UploadFile, File, HTTPException
import os
import shutil
from typing import List 
from pathlib import Path

router = APIRouter()

# This gives the directory of the current script
BASE_DIR = Path(__file__).resolve().parent / "artifacts"
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "model"

# Ensure directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
MODEL_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/")
async def upload(files: List[UploadFile] = File(...)):
    """
    Upload endpoint that stores files based on extension type.
    - .csv, .json, .xlsx go to /artifacts/data/
    - .pkl, .joblib, .onnx go to /artifacts/model/
    """
    saved_files = []
    
    # Define mapping
    data_exts = {".csv", ".json", ".xlsx"}
    model_exts = {".pkl", ".joblib", ".onnx"}
    
    for file in files:
       filename = file.filename
       file_ext = Path(filename).suffix.lower()

    
       # Decide destination path
       if file_ext in data_exts:
           dest_folder = DATA_DIR
       elif file_ext in model_exts:
           dest_folder = MODEL_DIR
       else:
           raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_ext}")

       # Final file path
       file_path = dest_folder / filename

      # Save the file
      with open(file_path, "wb") as buffer:
          shutil.copyfileobj(file.file, buffer)
      saved_files.append(str(file_path))

    return {
        "filename": filename,
        "saved_to": saved_files,
        "file_type": file.content_type,
        "status": "uploaded"
    }
