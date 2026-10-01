from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.rate_limit import check_login_rate_limit, record_failed_attempt, clear_failed_attempts
from app.core.deps import get_current_user
from app.models import User, LoginLog
from app.schemas import UserRegister, UserLogin, Token, UserOut

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_user(
    user_in: UserRegister,
    request: Request,
    db: Session = Depends(get_db)
):
    """Register a new user account and return JWT access token."""
    # Check if username exists
    existing_user = db.query(User).filter(User.username == user_in.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this username already exists"
        )

    # Hash password and create user
    hashed_pwd = get_password_hash(user_in.password)
    user = User(
        username=user_in.username,
        password_hash=hashed_pwd,
        full_name=user_in.full_name,
        whatsapp_number=user_in.whatsapp_number,
        role="user",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Log successful registration as initial login
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    login_log = LoginLog(
        user_id=user.id,
        username=user.username,
        ip_address=client_ip,
        user_agent=user_agent,
        success=True
    )
    db.add(login_log)
    db.commit()

    # Generate JWT
    token_str = create_access_token(subject=user.id, role=user.role)
    return Token(
        access_token=token_str,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )


@router.post("/login", response_model=Token)
def login_user(
    credentials: UserLogin,
    request: Request,
    db: Session = Depends(get_db)
):
    """Authenticate credentials with rate-limiting and audit logging."""
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")

    # 1. Enforce rate limiting
    check_login_rate_limit(request, credentials.username)

    # 2. Query user
    user = db.query(User).filter(User.username == credentials.username).first()

    # 3. Check password
    if not user or not verify_password(credentials.password, user.password_hash):
        record_failed_attempt(request, credentials.username)
        # Audit log failed attempt
        fail_log = LoginLog(
            user_id=user.id if user else None,
            username=credentials.username,
            ip_address=client_ip,
            user_agent=user_agent,
            success=False
        )
        db.add(fail_log)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Contact system administrator."
        )

    # Clear rate limiter on success
    clear_failed_attempts(request, credentials.username)

    # Audit log successful login
    success_log = LoginLog(
        user_id=user.id,
        username=user.username,
        ip_address=client_ip,
        user_agent=user_agent,
        success=True
    )
    db.add(success_log)
    db.commit()

    token_str = create_access_token(subject=user.id, role=user.role)
    return Token(
        access_token=token_str,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )


@router.get("/me", response_model=UserOut)
def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Retrieve profile of authenticated user."""
    return UserOut.model_validate(current_user)
