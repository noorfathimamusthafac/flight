from fastapi import status


def test_booking_and_pnr_uniqueness(client):
    # 1. Register and get token
    reg_resp = client.post("/api/v1/auth/register", json={
        "username": "booker_test",
        "password": "Password123",
        "full_name": "Booking Tester",
        "whatsapp_number": "+919876543211"
    })
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Search for a flight to get a valid flight_id
    search_resp = client.get("/api/v1/flights/search?from=COK&to=DXB&date=2026-10-20&passengers=1")
    flights = search_resp.json()["results"]
    assert len(flights) > 0
    flight_id = flights[0]["id"]
    price = flights[0]["price_inr"]

    # 3. Create First Booking
    booking_payload = {
        "flight_id": flight_id,
        "passengers": [
            {
                "full_name": "John Doe",
                "age": 30,
                "gender": "Male",
                "passport_number": "J892100",
                "seat_number": "12A"
            }
        ],
        "card_number": "4242 4242 4242 4242",
        "card_expiry": "12/28",
        "card_cvv": "123",
        "card_holder": "John Doe"
    }

    b1_resp = client.post("/api/v1/bookings", json=booking_payload, headers=headers)
    assert b1_resp.status_code == status.HTTP_201_CREATED
    b1_data = b1_resp.json()
    pnr1 = b1_data["pnr"]
    assert len(pnr1) == 6
    assert pnr1.isupper()
    assert b1_data["total_amount"] == price

    # 4. Create Second Booking to verify unique PNR
    b2_resp = client.post("/api/v1/bookings", json=booking_payload, headers=headers)
    assert b2_resp.status_code == status.HTTP_201_CREATED
    pnr2 = b2_resp.json()["pnr"]
    assert len(pnr2) == 6
    assert pnr1 != pnr2  # PNRs must be unique!

    # 5. Verify /bookings/me
    my_resp = client.get("/api/v1/bookings/me", headers=headers)
    assert my_resp.status_code == status.HTTP_200_OK
    assert len(my_resp.json()) >= 2
