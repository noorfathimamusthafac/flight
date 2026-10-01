from fastapi import status


def test_valid_flight_search(client):
    # Test Kerala origin (COK) to Gulf destination (DXB)
    resp = client.get("/api/v1/flights/search?from=COK&to=DXB&date=2026-10-15&passengers=1")
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    assert data["origin"] == "COK"
    assert data["destination"] == "DXB"
    assert len(data["results"]) >= 5
    assert data["cheapest_price"] > 0
    assert len(data["airline_comparison"]) >= 3

    # Check tags exist
    first_flight = data["results"][0]
    assert "airline" in first_flight
    assert "price_inr" in first_flight
    assert "tags" in first_flight
    assert isinstance(first_flight["tags"], list)


def test_invalid_origin_airport_rejected(client):
    # Origin must be Kerala airport (COK, CCJ, TRV, CNN)
    resp = client.get("/api/v1/flights/search?from=DEL&to=DXB&date=2026-10-15")
    assert resp.status_code == status.HTTP_400_BAD_REQUEST
    assert "not supported" in resp.json()["detail"].lower()


def test_invalid_destination_rejected(client):
    # Destination must be in allowed Gulf list
    resp = client.get("/api/v1/flights/search?from=COK&to=LHR&date=2026-10-15")
    assert resp.status_code == status.HTTP_400_BAD_REQUEST
    assert "not supported" in resp.json()["detail"].lower()
