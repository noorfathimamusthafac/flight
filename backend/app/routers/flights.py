from datetime import datetime, date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_optional_user
from app.models import User
from app.schemas import FlightSearchResponse, FlightOut
from app.services.flight_service import search_and_cache_flights, get_flight_by_id
from app.services.llm_service import ALLOWED_ORIGINS, ALLOWED_DESTINATIONS

router = APIRouter(prefix="/flights", tags=["Flights"])


@router.get("/search", response_model=FlightSearchResponse)
async def search_flights(
    request: Request,
    from_code: str = Query(..., alias="from", description="Kerala Origin airport code (COK, CCJ, TRV, CNN)"),
    to_code: str = Query(..., alias="to", description="Gulf Destination airport code (DXB, AUH, KWI, DOH, MCT)"),
    travel_date: str = Query(..., alias="date", description="Departure date in YYYY-MM-DD"),
    passengers: int = Query(1, ge=1, le=9, description="Number of passengers (1-9)"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Search flights from Kerala to Gulf destinations.
    Results are generated via LLM with deterministic fallback, cached for 30 minutes,
    and tagged with value metrics.
    """
    origin = from_code.strip().upper()
    dest = to_code.strip().upper()

    # 1. Validate Origin
    if origin not in ALLOWED_ORIGINS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Origin '{origin}' is not supported. Allowed Kerala airports: {', '.join(ALLOWED_ORIGINS.keys())}"
        )

    # 2. Validate Destination
    if dest not in ALLOWED_DESTINATIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Destination '{dest}' is not supported. Allowed Gulf destinations: {', '.join(ALLOWED_DESTINATIONS.keys())}"
        )

    # 3. Validate Date
    try:
        parsed_date = datetime.strptime(travel_date.strip(), "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Expected YYYY-MM-DD"
        )

    client_ip = request.client.host if request.client else "unknown"

    return await search_and_cache_flights(
        db=db,
        origin=origin,
        destination=dest,
        date=travel_date.strip(),
        passengers=passengers,
        user=current_user,
        ip_address=client_ip
    )


@router.get("/{flight_id}", response_model=FlightOut)
def get_flight_details(
    flight_id: str,
    db: Session = Depends(get_db)
):
    """Retrieve details for a specific flight by UUID."""
    flight = get_flight_by_id(db, flight_id)
    if not flight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flight '{flight_id}' not found"
        )
    return FlightOut.model_validate(flight)
