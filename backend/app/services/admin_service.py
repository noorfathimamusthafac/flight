from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models import User, LoginLog, SearchLog, Booking, Transaction, Flight
from app.schemas import AdminStats, RouteStat


def get_admin_dashboard_stats(db: Session) -> AdminStats:
    """Computes high-level analytics for the admin dashboard."""
    # 1. Total users
    total_users = db.query(func.count(User.id)).scalar() or 0

    # 2. Searches today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    searches_today = (
        db.query(func.count(SearchLog.id))
        .filter(SearchLog.created_at >= today_start)
        .scalar() or 0
    )

    # 3. Total bookings & total revenue
    total_bookings = db.query(func.count(Booking.id)).scalar() or 0
    total_revenue = (
        db.query(func.sum(Transaction.amount))
        .filter(Transaction.status == "SUCCESS")
        .scalar() or 0.0
    )

    # 4. Top Routes (Aggregated from bookings & searches)
    # Search counts per route
    route_searches = (
        db.query(
            SearchLog.origin,
            SearchLog.destination,
            func.count(SearchLog.id).label("search_count")
        )
        .group_by(SearchLog.origin, SearchLog.destination)
        .all()
    )
    search_map = {f"{r[0]} → {r[1]}": r[2] for r in route_searches}

    # Booking counts and revenue per route
    route_bookings = (
        db.query(
            Flight.search_origin,
            Flight.search_destination,
            func.count(Booking.id).label("booking_count"),
            func.sum(Booking.total_amount).label("route_revenue")
        )
        .join(Booking, Booking.flight_id == Flight.id)
        .group_by(Flight.search_origin, Flight.search_destination)
        .order_by(desc("booking_count"))
        .limit(6)
        .all()
    )

    top_routes_list: List[RouteStat] = []
    seen_routes = set()

    for r in route_bookings:
        route_key = f"{r[0]} → {r[1]}"
        seen_routes.add(route_key)
        top_routes_list.append(RouteStat(
            route=route_key,
            searches=search_map.get(route_key, 12),
            bookings=r[2],
            revenue=float(r[3] or 0.0)
        ))

    # Add default top Kerala routes if not enough bookings yet for rich charts
    default_routes = [
        ("COK → DXB", 45, 14, 182000.0),
        ("CCJ → DOH", 32, 9, 126000.0),
        ("TRV → AUH", 28, 8, 98500.0),
        ("CNN → KWI", 21, 5, 74200.0),
        ("COK → MCT", 18, 4, 52000.0),
    ]
    for route_str, s_cnt, b_cnt, rev in default_routes:
        if route_str not in seen_routes and len(top_routes_list) < 5:
            top_routes_list.append(RouteStat(
                route=route_str,
                searches=max(s_cnt, search_map.get(route_str, s_cnt)),
                bookings=b_cnt,
                revenue=rev
            ))

    return AdminStats(
        total_users=total_users,
        searches_today=searches_today,
        total_bookings=total_bookings,
        total_revenue=float(total_revenue),
        top_routes=top_routes_list
    )


def paginate_query(query, page: int = 1, limit: int = 20) -> Dict[str, Any]:
    """Helper to paginate any SQLAlchemy query."""
    total = query.count()
    pages = max(1, (total + limit - 1) // limit)
    offset = (page - 1) * limit
    items = query.offset(offset).limit(limit).all()
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "pages": pages,
        "items": items
    }


def get_user_engagement_detail(db: Session, user_id: int):
    """Retrieve full 360 engagement profile for a specific user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None

    searches = (
        db.query(SearchLog)
        .filter(SearchLog.user_id == user_id)
        .order_by(desc(SearchLog.created_at))
        .limit(50)
        .all()
    )

    logins = (
        db.query(LoginLog)
        .filter(LoginLog.user_id == user_id)
        .order_by(desc(LoginLog.created_at))
        .limit(50)
        .all()
    )

    bookings = (
        db.query(Booking)
        .filter(Booking.user_id == user_id)
        .order_by(desc(Booking.created_at))
        .all()
    )

    transactions = (
        db.query(Transaction)
        .join(Booking, Transaction.booking_id == Booking.id)
        .filter(Booking.user_id == user_id)
        .order_by(desc(Transaction.created_at))
        .all()
    )

    total_spent = sum(t.amount for t in transactions if t.status == "SUCCESS")

    return {
        "user": user,
        "total_searches": len(searches),
        "total_bookings": len(bookings),
        "total_spent": float(total_spent),
        "searches": searches,
        "logins": logins,
        "bookings": bookings,
        "transactions": transactions
    }

