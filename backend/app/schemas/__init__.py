import re
from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, field_validator, ConfigDict


# ==========================================
# AUTH SCHEMAS
# ==========================================

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=100)
    full_name: str = Field(..., min_length=2, max_length=100)
    whatsapp_number: str = Field(..., description="E.164 format, e.g. +919876543210")

    @field_validator("whatsapp_number")
    @classmethod
    def validate_e164(cls, v: str) -> str:
        # Clean spaces and dashes
        v_clean = re.sub(r"[\s\-]", "", v)
        if not re.match(r"^\+[1-9]\d{7,14}$", v_clean):
            raise ValueError("WhatsApp number must be in valid E.164 format (e.g. +919876543210)")
        return v_clean


class UserLogin(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    full_name: str
    whatsapp_number: str
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ==========================================
# FLIGHT SCHEMAS
# ==========================================

class ItineraryRaw(BaseModel):
    airline: str
    flight_number: str
    departure_time: str
    arrival_time: str
    duration_minutes: int = Field(gt=30, lt=2000)
    stops: int = Field(ge=0, le=2)
    layover_airport: Optional[str] = None
    layover_duration_minutes: Optional[int] = 0
    price_inr: float = Field(gt=1000)
    baggage: Optional[str] = "7kg Cabin, 25kg Check-in"
    seats_available: Optional[int] = 9
    aircraft: Optional[str] = "Airbus A320 / Boeing 737"


class LLMFlightResponse(BaseModel):
    flights: List[ItineraryRaw]


class FlightOut(BaseModel):
    id: str
    search_origin: str
    search_destination: str
    search_date: str
    airline: str
    flight_number: str
    departure_time: str
    arrival_time: str
    duration_minutes: int
    stops: int
    layover_airport: Optional[str]
    layover_duration_minutes: Optional[int]
    price_inr: float
    baggage: str
    seats_available: int
    aircraft: str
    tags: List[str]
    price_diff_vs_cheapest: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AirlineComparisonItem(BaseModel):
    airline: str
    min_price: float
    price_diff_vs_cheapest: float
    direct_flight_available: bool
    flight_count: int


class FlightSearchResponse(BaseModel):
    origin: str
    destination: str
    date: str
    passengers: int
    cheapest_price: float
    fastest_duration_minutes: int
    results: List[FlightOut]
    airline_comparison: List[AirlineComparisonItem]


# ==========================================
# BOOKING & PASSENGER SCHEMAS
# ==========================================

class PassengerCreate(BaseModel):
    full_name: str = Field(..., min_length=2)
    age: int = Field(..., ge=1, le=120)
    gender: str = Field(..., pattern="^(Male|Female|Other)$")
    passport_number: Optional[str] = None
    seat_number: Optional[str] = "12A"


class PassengerOut(BaseModel):
    id: int
    full_name: str
    age: int
    gender: str
    passport_number: Optional[str]
    seat_number: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class BookingCreate(BaseModel):
    flight_id: str
    passengers: List[PassengerCreate] = Field(..., min_length=1)
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    # Mock Payment Info (Card details are NOT saved to DB for PCI compliance)
    card_number: str = Field(..., min_length=12)
    card_expiry: str = Field(..., min_length=4)
    card_cvv: str = Field(..., min_length=3)
    card_holder: str = Field(..., min_length=2)


class TransactionOut(BaseModel):
    id: int
    amount: float
    status: str
    reference: str
    payment_method: str
    card_last4: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BookingOut(BaseModel):
    id: int
    pnr: str
    flight_id: str
    total_amount: float
    status: str
    travel_date: str
    contact_phone: str
    contact_email: str
    created_at: datetime
    flight: Optional[FlightOut] = None
    passengers: List[PassengerOut] = []
    transaction: Optional[TransactionOut] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# ADMIN & LOG SCHEMAS
# ==========================================

class RouteStat(BaseModel):
    route: str
    searches: int
    bookings: int
    revenue: float


class AdminStats(BaseModel):
    total_users: int
    searches_today: int
    total_bookings: int
    total_revenue: float
    top_routes: List[RouteStat]


class PaginatedResponse(BaseModel):
    total: int
    page: int
    limit: int
    pages: int
    items: List[Any]


class LoginLogOut(BaseModel):
    id: int
    username: str
    ip_address: Optional[str]
    user_agent: Optional[str]
    success: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SearchLogOut(BaseModel):
    id: int
    username: Optional[str] = None
    origin: str
    destination: str
    travel_date: str
    passengers: int
    ip_address: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserEngagementDetail(BaseModel):
    user: UserOut
    total_searches: int
    total_bookings: int
    total_spent: float
    searches: List[SearchLogOut]
    logins: List[LoginLogOut]
    bookings: List[BookingOut]
    transactions: List[TransactionOut]

