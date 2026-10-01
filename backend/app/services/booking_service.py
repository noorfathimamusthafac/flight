import random
import string
import uuid
from typing import List, Optional
from fastapi import HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.models import Booking, Flight, Passenger, Transaction, User
from app.schemas import BookingCreate
from app.services.whatsapp_service import send_whatsapp_booking_notification


def generate_unique_pnr(db: Session) -> str:
    """
    Generates a unique 6-character uppercase alphanumeric PNR code.
    E.g. SB7K9X (excluding ambiguous letters like O, 0, I, 1).
    """
    chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    max_attempts = 100
    for _ in range(max_attempts):
        pnr = "".join(random.choices(chars, k=6))
        exists = db.query(Booking).filter(Booking.pnr == pnr).first()
        if not exists:
            return pnr
    # Fallback to UUID-based
    return uuid.uuid4().hex[:6].upper()


def create_new_booking(
    db: Session,
    booking_in: BookingCreate,
    user: User,
    background_tasks: BackgroundTasks
) -> Booking:
    """
    Atomically creates a booking, passenger records, and mock payment transaction.
    Triggers a background task to send the WhatsApp confirmation.
    """
    # 1. Verify Flight Existence
    flight = db.query(Flight).filter(Flight.id == booking_in.flight_id).first()
    if not flight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The selected flight itinerary was not found or has expired. Please search again."
        )

    # 2. Check seat availability
    passenger_count = len(booking_in.passengers)
    if flight.seats_available < passenger_count:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only {flight.seats_available} seats remaining on this flight."
        )

    # 3. Calculate total amount
    total_amount = round(flight.price_inr * passenger_count, 2)
    pnr = generate_unique_pnr(db)

    # Resolve contact info
    contact_phone = booking_in.contact_phone or user.whatsapp_number
    contact_email = booking_in.contact_email or f"{user.username}@skybook.air"

    # 4. Create Booking
    booking = Booking(
        pnr=pnr,
        user_id=user.id,
        flight_id=flight.id,
        total_amount=total_amount,
        status="CONFIRMED",
        travel_date=flight.search_date,
        contact_phone=contact_phone,
        contact_email=contact_email
    )
    db.add(booking)
    db.flush()  # to get booking.id

    # 5. Create Passengers
    for p_in in booking_in.passengers:
        passenger = Passenger(
            booking_id=booking.id,
            full_name=p_in.full_name,
            age=p_in.age,
            gender=p_in.gender,
            passport_number=p_in.passport_number,
            seat_number=p_in.seat_number or "14B"
        )
        db.add(passenger)

    # 6. Create Transaction (Mock Payment Success)
    card_last4 = booking_in.card_number.replace(" ", "")[-4:] if len(booking_in.card_number) >= 4 else "4242"
    txn_ref = f"TXN-{pnr}-{uuid.uuid4().hex[:6].upper()}"

    transaction = Transaction(
        booking_id=booking.id,
        amount=total_amount,
        status="SUCCESS",
        reference=txn_ref,
        payment_method="CREDIT_CARD",
        card_last4=card_last4
    )
    db.add(transaction)

    # Update seats available
    flight.seats_available = max(0, flight.seats_available - passenger_count)

    db.commit()
    db.refresh(booking)

    # 7. Enqueue WhatsApp notification in background task
    primary_passenger_name = booking_in.passengers[0].full_name if booking_in.passengers else user.full_name
    background_tasks.add_task(
        send_whatsapp_booking_notification,
        booking_id=booking.id,
        phone_number=contact_phone,
        pnr=booking.pnr,
        passenger_name=primary_passenger_name,
        origin=flight.search_origin,
        destination=flight.search_destination,
        airline=flight.airline,
        flight_number=flight.flight_number,
        travel_date=flight.search_date,
        departure_time=flight.departure_time,
        amount_paid=total_amount
    )

    return booking


def get_user_bookings(db: Session, user_id: int) -> List[Booking]:
    """Retrieve all bookings for a user ordered by most recent."""
    return (
        db.query(Booking)
        .filter(Booking.user_id == user_id)
        .order_by(Booking.created_at.desc())
        .all()
    )


def get_booking_by_pnr(db: Session, pnr: str, user: Optional[User] = None) -> Optional[Booking]:
    """Retrieve booking by unique PNR."""
    query = db.query(Booking).filter(Booking.pnr == pnr.upper())
    booking = query.first()
    if not booking:
        return None
    
    # If user is not admin and doesn't own this booking, restrict access
    if user and user.role != "admin" and booking.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this booking"
        )
    return booking
