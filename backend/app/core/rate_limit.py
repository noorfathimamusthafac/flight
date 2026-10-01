import time
from collections import defaultdict
from fastapi import HTTPException, status, Request

# In-memory sliding window rate limiter for login
# Key: ip_address or username, Value: list of timestamp attempts
_attempts = defaultdict(list)
MAX_ATTEMPTS = 5
WINDOW_SECONDS = 300  # 5 minutes


def check_login_rate_limit(request: Request, username: str):
    """Enforces rate limiting on login attempts based on client IP or username."""
    now = time.time()
    client_ip = request.client.host if request.client else "unknown"
    key = f"{client_ip}:{username}"

    # Clean old attempts outside the window
    _attempts[key] = [t for t in _attempts[key] if now - t < WINDOW_SECONDS]

    if len(_attempts[key]) >= MAX_ATTEMPTS:
        retry_after = int(WINDOW_SECONDS - (now - _attempts[key][0]))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Please wait {max(1, retry_after)} seconds before trying again."
        )


def record_failed_attempt(request: Request, username: str):
    """Records a failed login attempt."""
    now = time.time()
    client_ip = request.client.host if request.client else "unknown"
    key = f"{client_ip}:{username}"
    _attempts[key].append(now)


def clear_failed_attempts(request: Request, username: str):
    """Clears failed attempts upon successful login."""
    client_ip = request.client.host if request.client else "unknown"
    key = f"{client_ip}:{username}"
    if key in _attempts:
        del _attempts[key]
