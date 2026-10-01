from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.core.deps import get_current_admin
from app.models import User, LoginLog, SearchLog, Booking, Transaction
from app.schemas import (
    AdminStats, PaginatedResponse, UserOut, LoginLogOut, SearchLogOut,
    BookingOut, TransactionOut, UserEngagementDetail
)
from app.services.admin_service import (
    get_admin_dashboard_stats, paginate_query, get_user_engagement_detail
)

router = APIRouter(prefix="/admin", tags=["Admin Portal"])


@router.get("/stats", response_model=AdminStats)
def get_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Get high-level business metrics, revenue, and route analytics."""
    return get_admin_dashboard_stats(db)


@router.get("/users", response_model=PaginatedResponse)
def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100),
    role: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Retrieve paginated users with optional search."""
    query = db.query(User).order_by(desc(User.created_at))
    if role:
        query = query.filter(User.role == role)
    if q:
        query = query.filter(User.username.ilike(f"%{q}%") | User.full_name.ilike(f"%{q}%"))

    result = paginate_query(query, page=page, limit=limit)
    result["items"] = [UserOut.model_validate(u) for u in result["items"]]
    return result


@router.get("/users/{user_id}/engagement", response_model=UserEngagementDetail)
def get_user_engagement(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Retrieve complete 360 engagement profile (searches, logins, bookings, transactions) for a user."""
    detail = get_user_engagement_detail(db, user_id)
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} was not found"
        )
    return detail


@router.get("/login-logs", response_model=PaginatedResponse)
def get_login_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    success: Optional[bool] = Query(None),
    q: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Retrieve paginated login attempts with success filter."""
    query = db.query(LoginLog).order_by(desc(LoginLog.created_at))
    if success is not None:
        query = query.filter(LoginLog.success == success)
    if q:
        query = query.filter(LoginLog.username.ilike(f"%{q}%"))

    result = paginate_query(query, page=page, limit=limit)
    result["items"] = [LoginLogOut.model_validate(l) for l in result["items"]]
    return result


@router.get("/search-logs", response_model=PaginatedResponse)
def get_search_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    origin: Optional[str] = Query(None),
    destination: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Retrieve paginated flight search logs."""
    query = db.query(SearchLog).order_by(desc(SearchLog.created_at))
    if origin:
        query = query.filter(SearchLog.origin == origin.upper())
    if destination:
        query = query.filter(SearchLog.destination == destination.upper())

    result = paginate_query(query, page=page, limit=limit)
    result["items"] = [SearchLogOut.model_validate(s) for s in result["items"]]
    return result


@router.get("/bookings", response_model=PaginatedResponse)
def get_admin_bookings(
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100),
    pnr: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Retrieve paginated bookings."""
    query = db.query(Booking).order_by(desc(Booking.created_at))
    if pnr:
        query = query.filter(Booking.pnr.ilike(f"%{pnr}%"))
    if status:
        query = query.filter(Booking.status == status)

    result = paginate_query(query, page=page, limit=limit)
    result["items"] = [BookingOut.model_validate(b) for b in result["items"]]
    return result


@router.get("/transactions", response_model=PaginatedResponse)
def get_admin_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Retrieve paginated transactions."""
    query = db.query(Transaction).order_by(desc(Transaction.created_at))
    if status:
        query = query.filter(Transaction.status == status)

    result = paginate_query(query, page=page, limit=limit)
    result["items"] = [TransactionOut.model_validate(t) for t in result["items"]]
    return result
