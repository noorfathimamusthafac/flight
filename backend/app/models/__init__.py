import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text, JSON, Index
)
from sqlalchemy.orm import relationship

from app.core.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(128), nullable=False)
    whatsapp_number = Column(String(32), nullable=False)
    role = Column(String(16), default="user", nullable=False)  # "user" or "admin"
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan")
    login_logs = relationship("LoginLog", back_populates="user")
    search_logs = relationship("SearchLog", back_populates="user")


class LoginLog(Base):
    __tablename__ = "login_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    username = Column(String(64), index=True, nullable=False)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    success = Column(Boolean, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True, nullable=False)

    user = relationship("User", back_populates="login_logs")


class SearchLog(Base):
    __tablename__ = "search_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    origin = Column(String(8), index=True, nullable=False)
    destination = Column(String(8), index=True, nullable=False)
    travel_date = Column(String(16), index=True, nullable=False)
    passengers = Column(Integer, default=1, nullable=False)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True, nullable=False)

    user = relationship("User", back_populates="search_logs")


class Flight(Base):
    __tablename__ = "flights"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    search_origin = Column(String(8), index=True, nullable=False)
    search_destination = Column(String(8), index=True, nullable=False)
    search_date = Column(String(16), index=True, nullable=False)
    
    airline = Column(String(64), index=True, nullable=False)
    flight_number = Column(String(32), nullable=False)
    departure_time = Column(String(16), nullable=False)
    arrival_time = Column(String(16), nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    stops = Column(Integer, default=0, nullable=False)  # 0 direct, 1, 2
    layover_airport = Column(String(8), nullable=True)
    layover_duration_minutes = Column(Integer, nullable=True)
    price_inr = Column(Float, nullable=False)
    baggage = Column(String(64), default="7kg Cabin, 25kg Check-in")
    seats_available = Column(Integer, default=9)
    aircraft = Column(String(64), default="Boeing 737 / Airbus A320")
    
    # Computed metrics & tags
    tags = Column(JSON, default=list)  # e.g. ["Cheapest", "Fastest", "Fewest stops", "Best value"]
    price_diff_vs_cheapest = Column(Float, default=0.0)
    
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True, nullable=False)

    bookings = relationship("Booking", back_populates="flight")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    pnr = Column(String(6), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    flight_id = Column(String(36), ForeignKey("flights.id"), index=True, nullable=False)
    
    total_amount = Column(Float, nullable=False)
    status = Column(String(32), default="CONFIRMED", index=True, nullable=False)  # CONFIRMED, CANCELLED
    travel_date = Column(String(16), nullable=False)
    contact_phone = Column(String(32), nullable=False)
    contact_email = Column(String(128), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True, nullable=False)

    # Relationships
    user = relationship("User", back_populates="bookings")
    flight = relationship("Flight", back_populates="bookings")
    passengers = relationship("Passenger", back_populates="booking", cascade="all, delete-orphan")
    transaction = relationship("Transaction", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    whatsapp_logs = relationship("WhatsAppLog", back_populates="booking")


class Passenger(Base):
    __tablename__ = "passengers"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), index=True, nullable=False)
    full_name = Column(String(128), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(16), nullable=False)
    passport_number = Column(String(32), nullable=True)
    seat_number = Column(String(8), default="12A")

    booking = relationship("Booking", back_populates="passengers")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), index=True, nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String(32), default="SUCCESS", index=True, nullable=False)  # SUCCESS, FAILED
    reference = Column(String(64), unique=True, index=True, nullable=False)
    payment_method = Column(String(32), default="CREDIT_CARD", nullable=False)
    card_last4 = Column(String(4), default="4242", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True, nullable=False)

    booking = relationship("Booking", back_populates="transaction")


class WhatsAppLog(Base):
    __tablename__ = "whatsapp_logs"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True, index=True)
    phone_number = Column(String(32), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(16), default="QUEUED", index=True, nullable=False)  # SENT, FAILED, QUEUED
    twilio_sid = Column(String(64), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True, nullable=False)

    booking = relationship("Booking", back_populates="whatsapp_logs")
