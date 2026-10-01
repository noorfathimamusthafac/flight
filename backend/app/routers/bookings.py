from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import User
from app.schemas import BookingCreate, BookingOut
from app.services.booking_service import create_new_booking, get_user_bookings, get_booking_by_pnr

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking_in: BookingCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new flight booking with passengers and mock payment.
    Enqueues a Twilio WhatsApp notification in a background task.
    """
    booking = create_new_booking(
        db=db,
        booking_in=booking_in,
        user=current_user,
        background_tasks=background_tasks
    )
    return BookingOut.model_validate(booking)


@router.get("/me", response_model=List[BookingOut])
def get_my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all bookings belonging to the currently logged in user."""
    bookings = get_user_bookings(db, current_user.id)
    return [BookingOut.model_validate(b) for b in bookings]


@router.get("/{pnr}", response_model=BookingOut)
def get_booking(
    pnr: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve details of a booking by its 6-character PNR code."""
    booking = get_booking_by_pnr(db, pnr, user=current_user)
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking with PNR '{pnr.upper()}' was not found"
        )
    return BookingOut.model_validate(booking)
