import os
import io
import joblib
import pandas as pd 
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from supabase import create_client, Client
from dotenv import load_dotenv
from ..api.upload import get_current_user

# Load from environment variables
load_dotenv()

router = APIRouter()

# --- Supabase Setup ---
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)
BUCKET_NAME = "artifacts"

# --- Pydantic Models for Input Data ---
class PredictionRequest(BaseModel):
    # The name of the user's uploaded Precessor file
    preprocessor_filename: str = Field(..., example="my_preprocessor.joblib")
    # The model file uploaded by user..
    model_filename: str = Field(..., example="my_model.joblib")
    # The new data for prediction, as a list of records (dictionaries)
    input_data: List[Dict[str, Any]] = Field(..., example=[{"age": 33, "city": "Paris", "income": 65000}])



# Inference Endpoint.
@router.post('/predict')
async def predict(request: PredictionRequest, current_user: dict = Depends(get_current_user)):
    """
    Makes predictions using a user's uploaded preprocessor and model.
    Requires authentication and ownership of the files.
    """

    user_id = current_user.id
    preprocessor_filename = request.preprocessor_filename
    model_filename = request.model_filename
    
    try:
        # --- Verify user owns both files ---
        required_files = {preprocessor_filename, model_filename}
        
        # Query the metadata table for these specific files belonging to the user
        response = supabase.table('file_metadata').select('filename').eq('uploader_user_id', user_id).in_('filename', list(required_files)).execute()
        
        owned_files = {item['filename'] for item in response.data}
        
        # If the set of owned files doesn't contain all required files, raise an error
        if not required_files.issubset(owned_files):
            raise HTTPException(status_code=404, detail="One or more specified files not found or you do not have access.")

        # --- Download and load the preprocessor ---
        preprocessor_path = f"model/{preprocessor_filename}"
        preprocessor_bytes = supabase.storage.from_(BUCKET_NAME).download(preprocessor_path)
        preprocessor = joblib.load(io.BytesIO(preprocessor_bytes))

        # --- Download and load the model ---
        model_path = f"model/{model_filename}"
        model_bytes = supabase.storage.from_(BUCKET_NAME).download(model_path)
        model = joblib.load(io.BytesIO(model_bytes))

        # --- Preprocess data and make predictions ---
        input_df = pd.DataFrame(request.input_data)
        
        processed_data = preprocessor.transform(input_df)
        predictions = model.predict(processed_data)
        
        return {"predictions": predictions.tolist()}

    except Exception as e:
        # Catch specific known exceptions if possible, otherwise a general error
        if isinstance(e, HTTPException):
            raise e # Re-raise HTTPException to preserve status code and detail
        raise HTTPException(status_code=500, detail=f"An error occurred during prediction: {e}")
