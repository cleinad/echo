"""
Authentication middleware using Supabase JWT.
"""
from typing import Annotated
from dataclasses import dataclass
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import get_settings

# Bearer token extractor
security = HTTPBearer()


@dataclass
class AuthenticatedUser:
    """Represents an authenticated user from JWT."""
    id: str
    email: str | None = None


def verify_token(token: str) -> dict:
    """
    Verify Supabase JWT and extract payload.
    Raises HTTPException if invalid.
    """
    settings = get_settings()
    
    try:
        # Decode and verify the JWT
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]
) -> AuthenticatedUser:
    """
    FastAPI dependency to extract and validate the current user.
    Usage: user: AuthenticatedUser = Depends(get_current_user)
    """
    payload = verify_token(credentials.credentials)
    
    # Extract user info from Supabase JWT claims
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing user ID"
        )
    
    return AuthenticatedUser(
        id=user_id,
        email=payload.get("email")
    )

# ensure the user is the owner of the resource
def ensure_ownership(user_id: str, resource_user_id: str):
    if user_id != resource_user_id:
        raise HTTPException(403, "Access denied")
