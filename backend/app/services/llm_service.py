import json
import logging
import hashlib
import random
from typing import List, Dict, Any, Optional
import httpx
from pydantic import ValidationError

from app.core.config import settings
from app.schemas import ItineraryRaw, LLMFlightResponse

logger = logging.getLogger(__name__)

# Allowed Kerala Origins
ALLOWED_ORIGINS = {
    "COK": "Kochi (Cochin)",
    "CCJ": "Kozhikode (Calicut)",
    "TRV": "Thiruvananthapuram (Trivandrum)",
    "CNN": "Kannur"
}

# Allowed Gulf Destinations
ALLOWED_DESTINATIONS = {
    "DXB": "Dubai, UAE",
    "AUH": "Abu Dhabi, UAE",
    "KWI": "Kuwait City, Kuwait",
    "DOH": "Doha, Qatar",
    "MCT": "Muscat, Oman"
}

AIRLINE_FLEETS = [
    {"name": "Air India Express", "prefix": "IX", "aircraft": "Boeing 737-800", "base_price": 9500, "baggage": "7kg Cabin + 25kg Check-in"},
    {"name": "IndiGo", "prefix": "6E", "aircraft": "Airbus A320neo", "base_price": 10200, "baggage": "7kg Cabin + 30kg Check-in"},
    {"name": "flydubai", "prefix": "FZ", "aircraft": "Boeing 737 MAX 8", "base_price": 11800, "baggage": "7kg Cabin + 30kg Check-in"},
    {"name": "Emirates", "prefix": "EK", "aircraft": "Boeing 777-300ER", "base_price": 23500, "baggage": "7kg Cabin + 35kg Check-in"},
    {"name": "Etihad Airways", "prefix": "EY", "aircraft": "Boeing 787-9 Dreamliner", "base_price": 21800, "baggage": "7kg Cabin + 35kg Check-in"},
    {"name": "Qatar Airways", "prefix": "QR", "aircraft": "Airbus A350-900", "base_price": 24200, "baggage": "7kg Cabin + 35kg Check-in"},
    {"name": "Kuwait Airways", "prefix": "KU", "aircraft": "Airbus A330-800neo", "base_price": 16900, "baggage": "7kg Cabin + 30kg Check-in"},
    {"name": "Oman Air", "prefix": "WY", "aircraft": "Boeing 787-8", "base_price": 17500, "baggage": "7kg Cabin + 30kg Check-in"},
]


def clean_json_text(text: str) -> str:
    """Strip code fences and trailing characters from LLM responses."""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


def generate_deterministic_flights(origin: str, dest: str, date: str) -> List[ItineraryRaw]:
    """
    Deterministic realistic flight generator used as fallback if LLM is unavailable or fails.
    Uses hash of (origin, dest, date) as seed so the exact same results are produced reliably.
    """
    seed_str = f"{origin}-{dest}-{date}"
    seed_int = int(hashlib.md5(seed_str.encode()).hexdigest(), 16) % 10000000
    rng = random.Random(seed_int)

    results: List[ItineraryRaw] = []
    
    # Generate 8 to 10 itineraries
    count = rng.randint(8, 10)
    selected_airlines = rng.sample(AIRLINE_FLEETS, count if count <= len(AIRLINE_FLEETS) else len(AIRLINE_FLEETS))
    if len(selected_airlines) < count:
        selected_airlines += rng.sample(AIRLINE_FLEETS, count - len(selected_airlines))

    departure_hours = [6, 8, 10, 13, 16, 19, 21, 23, 1, 3]

    for idx, airline_info in enumerate(selected_airlines):
        dep_hour = departure_hours[idx % len(departure_hours)]
        dep_min = rng.choice([0, 15, 30, 45])
        dep_time_str = f"{dep_hour:02d}:{dep_min:02d}"

        # Decide stops (Direct, 1-stop, or 2-stop)
        stop_choice = rng.choices([0, 1, 2], weights=[0.45, 0.40, 0.15])[0]

        if stop_choice == 0:
            duration = rng.randint(230, 270)  # ~4 hours direct
            layover_apt = None
            layover_dur = 0
            price_mult = 1.05  # Direct flights slight premium
        elif stop_choice == 1:
            duration = rng.randint(340, 520)  # ~6 to 8 hours
            layover_apt = rng.choice(["BOM", "BLR", "DEL", "BAH", "MCT"])
            layover_dur = rng.randint(60, 180)
            price_mult = 0.90
        else:
            duration = rng.randint(580, 840)  # ~10 to 14 hours
            layover_apt = rng.choice(["BOM, DXB", "BLR, DOH", "DEL, BAH"])
            layover_dur = rng.randint(180, 320)
            price_mult = 0.78  # 2 stops cheapest

        # Compute arrival time
        total_mins = dep_hour * 60 + dep_min + duration
        arr_hour = (total_mins // 60) % 24
        arr_min = total_mins % 60
        arr_time_str = f"{arr_hour:02d}:{arr_min:02d}"

        # Base price with random variation
        price_base = airline_info["base_price"] * price_mult
        jitter = rng.randint(-1200, 2800)
        final_price = round(max(7500.0, price_base + jitter), -1)

        flight_num = f"{airline_info['prefix']}-{rng.randint(201, 899)}"

        item = ItineraryRaw(
            airline=airline_info["name"],
            flight_number=flight_num,
            departure_time=dep_time_str,
            arrival_time=arr_time_str,
            duration_minutes=duration,
            stops=stop_choice,
            layover_airport=layover_apt,
            layover_duration_minutes=layover_dur,
            price_inr=final_price,
            baggage=airline_info["baggage"],
            seats_available=rng.randint(2, 9),
            aircraft=airline_info["aircraft"]
        )
        results.append(item)

    return results


async def call_gemini_api(origin: str, dest: str, date: str) -> Optional[List[ItineraryRaw]]:
    """Calls Google Gemini API using REST endpoint to generate flight options."""
    key = settings.GEMINI_API_KEY
    if not key or len(key) < 10:
        return None

    # Supported endpoints
    model_name = settings.GEMINI_MODEL or "gemini-1.5-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={key}"

    prompt = f"""
You are a flight pricing engine. Return ONLY a valid JSON object with key "flights" containing 8 to 10 realistic flight itineraries for:
Origin: {origin} ({ALLOWED_ORIGINS.get(origin, origin)})
Destination: {dest} ({ALLOWED_DESTINATIONS.get(dest, dest)})
Date: {date}

Include a diverse mix of:
- Airlines: Emirates, Air India Express, IndiGo, Qatar Airways, Etihad, Kuwait Airways, Oman Air, flydubai
- Stops: direct (0 stops), 1 stop (e.g. BOM, BLR, DOH, BAH), and 2 stops
- Prices: INR 8,500 to INR 38,000 depending on airline prestige and stops

JSON Structure:
{{
  "flights": [
    {{
      "airline": "Emirates",
      "flight_number": "EK-531",
      "departure_time": "10:30",
      "arrival_time": "13:45",
      "duration_minutes": 255,
      "stops": 0,
      "layover_airport": null,
      "layover_duration_minutes": 0,
      "price_inr": 23500,
      "baggage": "7kg Cabin, 35kg Check-in",
      "seats_available": 4,
      "aircraft": "Boeing 777-300ER"
    }}
  ]
}}
IMPORTANT: Respond with pure JSON only. Do not add markdown backticks, explanations, or notes.
"""

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.3,
            "responseMimeType": "application/json"
        }
    }

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                cleaned = clean_json_text(text)
                parsed = json.loads(cleaned)
                validated = LLMFlightResponse.model_validate(parsed)
                if len(validated.flights) >= 5:
                    return validated.flights
            else:
                logger.warning(f"Gemini API returned status {resp.status_code}: {resp.text[:150]}")
    except Exception as e:
        logger.warning(f"Gemini API call failed: {e}")

    return None


async def call_xai_grok_api(origin: str, dest: str, date: str) -> Optional[List[ItineraryRaw]]:
    """Calls xAI Grok API (OpenAI compatible) if key is provided."""
    key = settings.XAI_API_KEY
    if not key or len(key) < 10:
        return None

    url = "https://api.x.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }

    sys_prompt = "You are an airline reservation system. Respond ONLY with valid raw JSON. No markdown ticks."
    user_prompt = f"""
Generate 8 to 10 realistic flight itineraries from {origin} to {dest} on {date}.
JSON structure:
{{
  "flights": [
    {{
      "airline": "Air India Express",
      "flight_number": "IX-435",
      "departure_time": "08:15",
      "arrival_time": "11:30",
      "duration_minutes": 255,
      "stops": 0,
      "layover_airport": null,
      "layover_duration_minutes": 0,
      "price_inr": 10500,
      "baggage": "7kg Cabin, 25kg Check-in",
      "seats_available": 6,
      "aircraft": "Boeing 737-800"
    }}
  ]
}}
"""

    payload = {
        "model": settings.GROK_MODEL,
        "messages": [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.4
    }

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                cleaned = clean_json_text(content)
                parsed = json.loads(cleaned)
                validated = LLMFlightResponse.model_validate(parsed)
                if len(validated.flights) >= 5:
                    return validated.flights
    except Exception as e:
        logger.warning(f"xAI Grok call failed: {e}")

    return None


async def get_flight_itineraries(origin: str, dest: str, date: str) -> List[ItineraryRaw]:
    """
    Orchestrates flight generation:
    1. Attempts Gemini API call.
    2. Retries once if Gemini returned invalid format.
    3. Tries Grok API if configured.
    4. Falls back deterministically so the application never breaks.
    """
    # 1. Try Gemini
    flights = await call_gemini_api(origin, dest, date)
    if flights:
        return flights

    # Retry once for resilience
    flights = await call_gemini_api(origin, dest, date)
    if flights:
        return flights

    # 2. Try xAI Grok
    flights = await call_xai_grok_api(origin, dest, date)
    if flights:
        return flights

    # 3. Deterministic Local Fallback Generator
    logger.info(f"Using deterministic fallback flight engine for {origin} -> {dest} on {date}")
    return generate_deterministic_flights(origin, dest, date)
