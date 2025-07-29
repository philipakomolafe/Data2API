import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv

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

class UserSignIn(BaseModel):
    email: str
    password: str

# --- Endpoints ---
@router.post("/signup", tags=["Authentication"])
async def signup(user_credentials: UserCreate):
    """Creates a new user in the Supabase auth system."""
    try:
        response = supabase.auth.sign_up({
            "email": user_credentials.email,
            "password": user_credentials.password,
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

@router.post("/login", tags=["Authentication"])
async def login(user_credentials: UserSignIn):
    """Signs in a user and returns a JWT access token."""
    try:
        response = supabase.auth.sign_in_with_password({
            "email": user_credentials.email,
            "password": user_credentials.password
        })
        return response
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid login credentials: {e}")