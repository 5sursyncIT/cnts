import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.audit.events import log_event
from app.core.passwords import hash_password
from app.db.models import UserAccount
from app.db.session import get_db
from app.schemas.users import (
    PasswordResetPayload,
    PasswordResetResult,
    UserCreate,
    UserOut,
    UserUpdate,
)

router = APIRouter(prefix="/users")


@router.get("", response_model=list[UserOut])
def list_users(
    role: str | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    limit: int = Query(default=100, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> list[UserAccount]:
    """
    List all user accounts with optional filtering by role and active status.
    
    - **role**: Filter by user role (admin, biologiste, etc.)
    - **is_active**: Filter by active status
    - **limit**: Maximum number of results (default 100, max 500)
    - **offset**: Pagination offset
    """
    stmt = select(UserAccount)
    
    if role is not None:
        stmt = stmt.where(UserAccount.role == role)
    
    if is_active is not None:
        stmt = stmt.where(UserAccount.is_active.is_(is_active))
    
    stmt = stmt.order_by(UserAccount.created_at.desc()).limit(limit).offset(offset)
    
    return list(db.execute(stmt).scalars())


@router.post("", response_model=UserOut, status_code=201)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
) -> UserAccount:
    """
    Create a new user account.
    
    - **email**: Unique email address
    - **password**: Password (min 12 chars, mixed case, numbers)
    - **role**: User role (admin, biologiste, technicien_labo, agent_distribution)
    - **is_active**: Active status (default true)
    
    Password will be hashed using PBKDF2-SHA256.
    """
    # Check if user with this email already exists
    stmt = select(UserAccount).where(func.lower(UserAccount.email) == payload.email.lower())
    existing_user = db.execute(stmt).scalar_one_or_none()
    
    if existing_user is not None:
        raise HTTPException(status_code=409, detail="Un utilisateur avec cet email existe déjà")
    
    # Hash password
    password_hash = hash_password(payload.password)
    
    # Create user
    user = UserAccount(
        email=payload.email,
        password_hash=password_hash,
        role=payload.role,
        is_active=payload.is_active,
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Log event
    log_event(
        db,
        aggregate_type="user",
        aggregate_id=user.id,
        event_type="user.created",
        payload={"email": user.email, "role": user.role},
    )
    db.commit()
    
    return user


@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> UserAccount:
    """Get user details by ID."""
    user = db.get(UserAccount, user_id)
    
    if user is None:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    
    return user


@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: uuid.UUID,
    payload: UserUpdate,
    db: Session = Depends(get_db),
) -> UserAccount:
    """
    Update user account.
    
    - **email**: New email (must be unique)
    - **role**: New role
    - **is_active**: Active status
    """
    user = db.get(UserAccount, user_id)
    
    if user is None:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    
    changes = {}
    
    if payload.email is not None and payload.email != user.email:
        # Check if new email is already taken
        stmt = select(UserAccount).where(
            func.lower(UserAccount.email) == payload.email.lower(),
            UserAccount.id != user_id,
        )
        existing = db.execute(stmt).scalar_one_or_none()
        if existing is not None:
            raise HTTPException(status_code=409, detail="Cet email est déjà utilisé")
        
        user.email = payload.email
        changes["email"] = payload.email
    
    if payload.role is not None and payload.role != user.role:
        user.role = payload.role
        changes["role"] = payload.role
    
    if payload.is_active is not None and payload.is_active != user.is_active:
        user.is_active = payload.is_active
        changes["is_active"] = payload.is_active
    
    if changes:
        db.commit()
        db.refresh(user)
        
        # Log event
        log_event(
            db,
            aggregate_type="user",
            aggregate_id=user.id,
            event_type="user.updated",
            payload=changes,
        )
        db.commit()
    
    return user


@router.delete("/{user_id}")
def deactivate_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> dict:
    """
    Deactivate a user account (soft delete).
    
    This sets is_active to False rather than deleting the record.
    """
    user = db.get(UserAccount, user_id)
    
    if user is None:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    
    if not user.is_active:
        raise HTTPException(status_code=409, detail="Utilisateur déjà désactivé")
    
    user.is_active = False
    db.commit()
    
    # Log event
    log_event(
        db,
        aggregate_type="user",
        aggregate_id=user.id,
        event_type="user.deactivated",
        payload={"email": user.email},
    )
    db.commit()
    
    return {"user_id": str(user.id), "is_active": user.is_active}


@router.post("/{user_id}/reset-password", response_model=PasswordResetResult)
def reset_user_password(
    user_id: uuid.UUID,
    payload: PasswordResetPayload,
    db: Session = Depends(get_db),
) -> PasswordResetResult:
    """
    Reset user password (admin action).
    
    - **password**: New password (min 12 chars, mixed case, numbers)
    
    User will need to change this password on next login.
    """
    user = db.get(UserAccount, user_id)
    
    if user is None:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    
    # Hash new password
    user.password_hash = hash_password(payload.password)
    db.commit()
    
    # Log event
    log_event(
        db,
        aggregate_type="user",
        aggregate_id=user.id,
        event_type="user.password_reset",
        payload={"email": user.email, "reset_by": "admin"},
    )
    db.commit()
    
    return PasswordResetResult(user_id=user.id, success=True)
