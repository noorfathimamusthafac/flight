import logging
import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.models import WhatsAppLog

logger = logging.getLogger(__name__)


def send_whatsapp_booking_notification(
    booking_id: int,
    phone_number: str,
    pnr: str,
    passenger_name: str,
    origin: str,
    destination: str,
    airline: str,
    flight_number: str,
    travel_date: str,
    departure_time: str,
    amount_paid: float
):
    """
    Sends a WhatsApp booking confirmation message in a background task via Twilio WhatsApp API.
    Logs success or failure in the DB. Booking succeeds even if WhatsApp fails.
    """
    # Create independent DB session for background task
    db: Session = SessionLocal()
    
    # Format WhatsApp Message
    message_body = (
        f"✈️ *SkyBook Flight Confirmation*\n\n"
        f"Dear *{passenger_name}*,\n"
        f"Your flight booking is confirmed!\n\n"
        f"📌 *PNR:* *{pnr}*\n"
        f"🛫 *Route:* {origin} ➔ {destination}\n"
        f"✈️ *Airline:* {airline} ({flight_number})\n"
        f"📅 *Date:* {travel_date} at {departure_time}\n"
        f"💰 *Total Paid:* ₹{amount_paid:,.2f}\n\n"
        f"Please carry a valid government photo ID or passport at check-in.\n"
        f"Have a pleasant journey with *SkyBook*! 🌍"
    )

    # Initialize log entry as QUEUED
    log_entry = WhatsAppLog(
        booking_id=booking_id,
        phone_number=phone_number,
        message=message_body,
        status="QUEUED"
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)

    # Clean phone number for WhatsApp E.164
    recipient = phone_number.strip()
    if not recipient.startswith("whatsapp:"):
        recipient = f"whatsapp:{recipient}"

    account_sid = settings.TWILIO_ACCOUNT_SID
    auth_token = settings.TWILIO_AUTH_TOKEN
    from_number = settings.TWILIO_WHATSAPP_NUMBER

    # Check if credentials are placeholders or mock
    if not account_sid or account_sid.startswith("AC_mock") or not auth_token or auth_token == "mock_auth_token":
        logger.info(f"[Mock WhatsApp] Notification for PNR {pnr} to {phone_number}:\n{message_body}")
        log_entry.status = "SENT"
        log_entry.twilio_sid = f"SM_mock_{pnr}_{log_entry.id}"
        log_entry.error_message = "Mock sandbox delivery (live credentials not provided in env)"
        db.commit()
        db.close()
        return

    # Attempt live Twilio REST call
    url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
    data = {
        "From": from_number,
        "To": recipient,
        "Body": message_body
    }

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(url, data=data, auth=(account_sid, auth_token))
            if resp.status_code in (200, 201):
                res_data = resp.json()
                log_entry.status = "SENT"
                log_entry.twilio_sid = res_data.get("sid")
                log_entry.error_message = None
                logger.info(f"WhatsApp sent successfully to {phone_number} (SID: {log_entry.twilio_sid})")
            else:
                log_entry.status = "FAILED"
                log_entry.error_message = f"Twilio API Error {resp.status_code}: {resp.text[:300]}"
                logger.warning(f"Twilio WhatsApp failed for PNR {pnr}: {log_entry.error_message}")
    except Exception as e:
        log_entry.status = "FAILED"
        log_entry.error_message = f"Connection error: {str(e)}"
        logger.error(f"Error sending WhatsApp for PNR {pnr}: {e}")
    finally:
        db.commit()
        db.close()
