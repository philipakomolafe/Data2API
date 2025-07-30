import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from supabase import create_client, Client
from dotenv import load_dotenv
from typing import Optional

# Load environment variables
load_dotenv()

router = APIRouter()

# --- Supabase Setup ---
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

# --- Pydantic Models ---
class UserCreate(BaseModel):
    email: str
    password: str
    username: str = Field(..., min_length=3)
    full_name: Optional[str] = None

class UserSignIn(BaseModel):
    email: str
    password: str

# --- Endpoints ---
@router.post("/signup")
async def signup(user_credentials: UserCreate):
    """Creates a new user in the Supabase auth system."""
    try:
        response = supabase.auth.sign_up({
            "email": user_credentials.email,
            "password": user_credentials.password,
            "options": {
                "data": {
                    "username": user_credentials.username,
                    "full_name": user_credentials.full_name
                }
            }
        })
        # Check if user was created successfully
        if response.user:
            return {"message": "User created successfully. Please check your email to verify.", "user": response.user}
        elif response.session is None and response.user is None:
             # This case often means the user already exists but is unconfirmed.
             # Supabase's response can be nuanced here.
             raise HTTPException(status_code=409, detail="User likely already exists.")
        else:
            return response
            
    except Exception as e:
        # The Supabase client might raise an exception for existing users
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
async def login(user_credentials: UserSignIn):
    """Signs in a user and returns a JWT access token."""
    try:
        response = supabase.auth.sign_in_with_password({
            "email": user_credentials.email,
            "password": user_credentials.password
        })
        
        # Check for a successful login and return a clean response
        if response.session and response.session.access_token:
            return {
                "access_token": response.session.access_token,
                "token_type": "bearer",
                "user_id": response.user.id,
                "user_email": response.user.email
            }
        else:
            # Handle cases where login is not successful but doesn't raise an exception
            # This can happen if the user's email is not confirmed yet.
            raise HTTPException(status_code=401, detail="Invalid login credentials or user not verified")

    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid login credentials: {e}")