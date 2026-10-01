from fastapi import status


def test_register_and_login_flow(client):
    # 1. Register new user
    reg_payload = {
        "username": "testuser_unique",
        "password": "SecretPassword123",
        "full_name": "Test Traveler",
        "whatsapp_number": "+919876543210"
    }
    reg_resp = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_resp.status_code == status.HTTP_201_CREATED
    data = reg_resp.json()
    assert "access_token" in data
    assert data["user"]["username"] == "testuser_unique"
    token = data["access_token"]

    # 2. Get profile with token
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == status.HTTP_200_OK
    assert me_resp.json()["username"] == "testuser_unique"

    # 3. Login with credentials
    login_resp = client.post("/api/v1/auth/login", json={
        "username": "testuser_unique",
        "password": "SecretPassword123"
    })
    assert login_resp.status_code == status.HTTP_200_OK
    assert "access_token" in login_resp.json()


def test_login_invalid_password(client):
    login_resp = client.post("/api/v1/auth/login", json={
        "username": "admin",
        "password": "WrongPassword999"
    })
    assert login_resp.status_code == status.HTTP_401_UNAUTHORIZED


def test_invalid_whatsapp_number_format(client):
    # Must fail E.164 validation
    reg_payload = {
        "username": "badphone",
        "password": "Password123",
        "full_name": "Bad Phone",
        "whatsapp_number": "not-a-number"
    }
    reg_resp = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
