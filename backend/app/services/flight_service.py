import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import Flight, SearchLog, User
from app.schemas import FlightSearchResponse, FlightOut, AirlineComparisonItem, ItineraryRaw
from app.services.llm_service import get_flight_itineraries, ALLOWED_ORIGINS, ALLOWED_DESTINATIONS

CACHE_DURATION_MINUTES = 30


def compute_tags_and_differences(itineraries: List[ItineraryRaw]) -> List[Dict[str, Any]]:
    """
    Computes tags ("Cheapest", "Fastest", "Fewest stops", "Best value")
    and calculates price difference relative to the cheapest flight.
    """
    if not itineraries:
        return []

    min_price = min(it.price_inr for it in itineraries)
    min_duration = min(it.duration_minutes for it in itineraries)
    min_stops = min(it.stops for it in itineraries)

    # Compute best value score: weighted combination of price and duration
    # Lower score is better
    scored_items = []
    for idx, it in enumerate(itineraries):
        price_ratio = it.price_inr / min_price
        duration_ratio = it.duration_minutes / min_duration
        value_score = 0.6 * price_ratio + 0.4 * duration_ratio
        scored_items.append((value_score, idx))

    scored_items.sort(key=lambda x: x[0])
    best_value_idx = scored_items[0][1]

    enhanced = []
    for idx, it in enumerate(itineraries):
        tags = []
        if it.price_inr == min_price:
            tags.append("Cheapest")
        if it.duration_minutes == min_duration:
            tags.append("Fastest")
        if it.stops == min_stops and it.stops == 0:
            tags.append("Fewest stops")
        if idx == best_value_idx and "Cheapest" not in tags:
            tags.append("Best value")

        diff = round(it.price_inr - min_price, 2)
        enhanced.append({
            "raw": it,
            "tags": tags,
            "price_diff_vs_cheapest": diff
        })

    return enhanced


def compute_airline_comparison(flights: List[Flight], cheapest_overall: float) -> List[AirlineComparisonItem]:
    """Generates comparison summary aggregated by airline."""
    grouped: Dict[str, Dict[str, Any]] = {}
    for f in flights:
        if f.airline not in grouped:
            grouped[f.airline] = {
                "min_price": f.price_inr,
                "has_direct": f.stops == 0,
                "count": 1
            }
        else:
            grouped[f.airline]["count"] += 1
            if f.price_inr < grouped[f.airline]["min_price"]:
                grouped[f.airline]["min_price"] = f.price_inr
            if f.stops == 0:
                grouped[f.airline]["has_direct"] = True

    items = []
    for airline, data in grouped.items():
        diff = round(data["min_price"] - cheapest_overall, 2)
        items.append(AirlineComparisonItem(
            airline=airline,
            min_price=data["min_price"],
            price_diff_vs_cheapest=diff,
            direct_flight_available=data["has_direct"],
            flight_count=data["count"]
        ))

    items.sort(key=lambda x: x.min_price)
    return items


async def search_and_cache_flights(
    db: Session,
    origin: str,
    destination: str,
    date: str,
    passengers: int = 1,
    user: Optional[User] = None,
    ip_address: Optional[str] = None
) -> FlightSearchResponse:
    """
    Search flights with 30-minute caching.
    Persists flights to the database so price at search is exactly the price booked.
    """
    # Standardize codes
    origin = origin.upper()
    destination = destination.upper()

    # Log search in search_logs
    search_log = SearchLog(
        user_id=user.id if user else None,
        origin=origin,
        destination=destination,
        travel_date=date,
        passengers=passengers,
        ip_address=ip_address
    )
    db.add(search_log)
    db.commit()

    # 1. Check DB Cache
    cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=CACHE_DURATION_MINUTES)
    cached_flights = (
        db.query(Flight)
        .filter(
            Flight.search_origin == origin,
            Flight.search_destination == destination,
            Flight.search_date == date,
            Flight.created_at >= cutoff_time
        )
        .all()
    )

    if cached_flights and len(cached_flights) >= 5:
        cheapest_price = min(f.price_inr for f in cached_flights)
        fastest_duration = min(f.duration_minutes for f in cached_flights)
        comparison = compute_airline_comparison(cached_flights, cheapest_price)
        
        return FlightSearchResponse(
            origin=origin,
            destination=destination,
            date=date,
            passengers=passengers,
            cheapest_price=cheapest_price,
            fastest_duration_minutes=fastest_duration,
            results=[FlightOut.model_validate(f) for f in cached_flights],
            airline_comparison=comparison
        )

    # 2. Generate itineraries via LLM / Fallback
    raw_itineraries = await get_flight_itineraries(origin, destination, date)
    enhanced_list = compute_tags_and_differences(raw_itineraries)

    # 3. Persist to DB
    new_flight_records: List[Flight] = []
    for item in enhanced_list:
        raw = item["raw"]
        flight_record = Flight(
            id=str(uuid.uuid4()),
            search_origin=origin,
            search_destination=destination,
            search_date=date,
            airline=raw.airline,
            flight_number=raw.flight_number,
            departure_time=raw.departure_time,
            arrival_time=raw.arrival_time,
            duration_minutes=raw.duration_minutes,
            stops=raw.stops,
            layover_airport=raw.layover_airport,
            layover_duration_minutes=raw.layover_duration_minutes,
            price_inr=raw.price_inr,
            baggage=raw.baggage or "7kg Cabin, 25kg Check-in",
            seats_available=raw.seats_available or 9,
            aircraft=raw.aircraft or "Airbus A320 / Boeing 737",
            tags=item["tags"],
            price_diff_vs_cheapest=item["price_diff_vs_cheapest"]
        )
        db.add(flight_record)
        new_flight_records.append(flight_record)

    db.commit()
    for f in new_flight_records:
        db.refresh(f)

    cheapest_price = min(f.price_inr for f in new_flight_records)
    fastest_duration = min(f.duration_minutes for f in new_flight_records)
    comparison = compute_airline_comparison(new_flight_records, cheapest_price)

    return FlightSearchResponse(
        origin=origin,
        destination=destination,
        date=date,
        passengers=passengers,
        cheapest_price=cheapest_price,
        fastest_duration_minutes=fastest_duration,
        results=[FlightOut.model_validate(f) for f in new_flight_records],
        airline_comparison=comparison
    )


def get_flight_by_id(db: Session, flight_id: str) -> Optional[Flight]:
    """Retrieve flight record by UUID."""
    return db.query(Flight).filter(Flight.id == flight_id).first()
