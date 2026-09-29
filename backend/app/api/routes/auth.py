from fastapi import APIRouter, Cookie, Depends, Header, HTTPException, Response
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Profile
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _extract_token(
    authorization: str | None = Header(None),
    access_token: str | None = Cookie(None, alias="access_token"),
) -> str | None:
    if authorization and authorization.startswith("Bearer "):
        return authorization[7:].strip()
    return access_token


def get_current_user(
    authorization: str | None = Header(None),
    access_token: str | None = Cookie(None, alias="access_token"),
    db: Session = Depends(get_db),
) -> Profile | None:
    token = _extract_token(authorization, access_token)
    if not token:
        return None
    return auth_service.get_user_from_token(db, token)


def require_user(
    authorization: str | None = Header(None),
    access_token: str | None = Cookie(None, alias="access_token"),
    db: Session = Depends(get_db),
) -> Profile:
    token = _extract_token(authorization, access_token)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = auth_service.get_user_from_token(db, token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user


def check_is_admin(user: Profile) -> bool:
    from app.core.config import settings
    return bool(
        getattr(user, "is_admin", False)
        or (user.username and user.username.lower() in settings.admin_usernames_set)
    )


def require_admin(user: Profile = Depends(require_user)) -> Profile:
    if not check_is_admin(user):
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user


def _user_response(user: Profile) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        username=user.username,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
        is_admin=check_is_admin(user),
    )


@router.post("/register", response_model=AuthResponse)
def register(request: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    """Local register — used only in unit tests with in-memory SQLite DB."""
    if auth_service.get_user_by_email(db, request.email):
        raise HTTPException(status_code=409, detail="Email already registered")
    if auth_service.get_user_by_username(db, request.username):
        raise HTTPException(status_code=409, detail="Username already taken")

    user = auth_service.create_user(
        db,
        email=request.email,
        username=request.username,
        password=request.password,
        display_name=request.display_name,
    )
    token = auth_service.create_access_token(user.id)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=72 * 3600,
    )
    return AuthResponse(user=_user_response(user), token=token)


@router.post("/login", response_model=AuthResponse)
def login(request: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """Local login — used only in unit tests with in-memory SQLite DB."""
    user = auth_service.authenticate_user(db, request.email, request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = auth_service.create_access_token(user.id)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=72 * 3600,
    )
    return AuthResponse(user=_user_response(user), token=token)


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token", httponly=True, samesite="lax")
    return {"detail": "Logged out"}


@router.get("/me", response_model=UserResponse)
def get_me(user: Profile = Depends(require_user)):
    return _user_response(user)
