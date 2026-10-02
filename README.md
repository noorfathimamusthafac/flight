# ✈️ SkyBook: Enterprise Flight Ticket Booking & Telemetry Platform

[![Python 3.11+](https://img.shields.io/badge/Python-3.11%20%7C%203.13-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18.2+-61DAFB.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF.svg)](https://vitejs.dev/)
[![Docker Compose](https://img.shields.io/badge/Docker-Compose%20Ready-2496ED.svg)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**SkyBook** is an enterprise-grade full-stack flight booking and airspace telemetry platform built for a senior engineer interview demo. Connecting Kerala's international airports to Arabian Gulf destinations, SkyBook features a real-time AI rate-tracking engine, persistent price locking, unique 6-character PNR issuance, background WhatsApp notification dispatch, and a 360° User Engagement and Transaction Audit console for Administrators.

---

## 🎬 Live Platform Demo & Previews

| Interactive Demo Walkthrough (Animated) | Admin Operations Console & Telemetry |
| :---: | :---: |
| ![SkyBook Demo Animation](demo/skybook_demo.gif) | ![Admin Operations Console](demo/05_admin_dashboard.png) |

| AI Flight Rate Tracker & Results | Booking Confirmed & Instant PNR Issuance |
| :---: | :---: |
| ![SkyBook Flight Results](demo/02_flight_results.png) | ![Booking Confirmed](demo/08_booking_confirmed.png) |

| Multi-Passenger Checkout & Mock Payment | Admin Operations Gateway |
| :---: | :---: |
| ![Booking Checkout](demo/07_booking_checkout.png) | ![Admin Login Gateway](demo/04_admin_login.png) |

---

## 📑 Table of Contents
- [System Architecture](#-system-architecture)
- [Comprehensive Feature & Function Demo](#-comprehensive-feature--function-demo)
  - [1. User Registration & JWT Authentication](#1-user-registration--jwt-authentication)
  - [2. Dedicated Admin Operations Gateway](#2-dedicated-admin-operations-gateway)
  - [3. AI Flight Rate Tracker (Kerala to Gulf)](#3-ai-flight-rate-tracker-kerala-to-gulf)
  - [4. Smart Value Badges & Dynamic Sorting](#4-smart-value-badges--dynamic-sorting)
  - [5. Airline Fare Comparison Matrix](#5-airline-fare-comparison-matrix)
  - [6. Multi-Passenger Booking & Mock Card Payment](#6-multi-passenger-booking--mock-card-payment)
  - [7. Guaranteed Unique 6-Char PNR Generation](#7-guaranteed-unique-6-char-pnr-generation)
  - [8. Automated WhatsApp Telemetry Dispatch](#8-automated-whatsapp-telemetry-dispatch)
  - [9. My Bookings & Boarding Pass Viewer](#9-my-bookings--boarding-pass-viewer)
  - [10. Admin 360° User Engagement & Transaction Audit](#10-admin-360-user-engagement--transaction-audit)
  - [11. Airspace Telemetry & Route Bar Chart](#11-airspace-telemetry--route-bar-chart)
- [How to Run With One Command (Docker)](#-how-to-run-with-one-command-docker)
- [Running Locally Without Docker](#-running-locally-without-docker)
- [Running Pytest Unit Tests](#-running-pytest-unit-tests)
- [Database Schema (8 Relational Tables)](#-database-schema-8-relational-tables)
- [Security & Environment Variables](#-security--environment-variables)

---

## 🏛️ System Architecture

```
[ React 18 + Vite SPA ] ──(Axios + Bearer JWT)──> [ FastAPI Application (Port 8000) ]
        │                                                     │
   (Port 5173)                                   ┌────────────┴─────────────┐
                                                 ▼                          ▼
                                       [ PostgreSQL / SQLite ]     [ Gemini AI / Twilio ]
                                       - 8 Relational Tables       - Strict JSON Prompt
                                       - Alembic Migrations        - Background Tasks
                                       - Audit Logs & PNRs         - WhatsApp Telemetry
```

---

## 🌟 Comprehensive Feature & Function Demo

### 1. User Registration & JWT Authentication
- **Endpoint:** `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`
- **Frontend Pages:** `/register` and `/login`
- **Functionality:**
  - Validates full name, unique username, minimum 6-character password, and **E.164 phone formatting** (e.g., `+919876543210`).
  - Passwords hashed with direct **bcrypt** algorithm.
  - Generates a signed **JWT Access Token** valid for 60 minutes with `sub` (User ID) and `role` claims.
  - **Login Rate Limiter:** Protects `/auth/login` using an in-memory sliding-window limiter (max 5 failed attempts per 5 minutes per IP/username, returning HTTP 429).
  - Every login attempt (successful or failed) is automatically audited in the `login_logs` table with timestamp, IP, and client user-agent.

---

### 2. Dedicated Admin Operations Gateway
- **Frontend Page:** `/admin/login`
- **Functionality:**
  - A separate, high-security portal entrypoint with Security Level 4 styling.
  - Verifies the user has role `admin`. Any attempt by unauthorized accounts or standard passengers to access `/admin` automatically redirects to `/admin/login`.
  - **Pre-Seeded Credentials:**
    - **Username:** `admin`
    - **Password:** `Admin@123`
    *(Seeded automatically on startup via FastAPI lifespan hook).*

---

### 3. AI Flight Rate Tracker (Kerala to Gulf)
- **Endpoint:** `GET /api/v1/flights/search?from={origin}&to={dest}&date={date}&passengers={count}`
- **Corridors Supported:**
  - **Kerala Origins (4):** Kochi (`COK`), Kozhikode (`CCJ`), Thiruvananthapuram (`TRV`), Kannur (`CNN`).
  - **Gulf Destinations (5):** Dubai (`DXB`), Abu Dhabi (`AUH`), Doha (`DOH`), Kuwait City (`KWI`), Muscat (`MCT`).
- **Functionality:**
  - Calls **Google Gemini API** (or xAI Grok API) with a strict system prompt returning 8–10 realistic itineraries across premier carriers: *Emirates, Air India Express, IndiGo, Qatar Airways, Etihad, Kuwait Airways, Oman Air, flydubai*.
  - Strict Pydantic validation with automatic retry on JSON irregularities.
  - **Deterministic Cryptographic Fallback:** If the LLM key is absent or offline, an MD5-seeded generator creates consistent, realistic itineraries so the app **never fails**.
  - **Persistent Price Locking:** Every generated flight is stored in the `flights` table with a UUID. The price shown at search is the exact price booked.
  - **30-Minute DB Cache:** Consecutive searches for the same route and date within 30 minutes are served directly from the database to save API credits.

---

### 4. Smart Value Badges & Dynamic Sorting
- **Functionality:**
  - Backend dynamically computes tags and attaches them to each flight:
    - 🟢 **`Cheapest`**: The lowest fare available across all airlines.
    - 🔵 **`Fastest`**: Shortest air duration in minutes.
    - 🟣 **`Fewest stops`**: Non-stop direct flights.
    - 🟡 **`Best value`**: Normalized weighted score combining low price and short duration.
  - **Price Difference vs Cheapest Badge:** Displays exact variance (e.g. `★ Lowest Price` or `+₹2,400 vs cheapest`).
  - **Interactive Sorting Tabs:** Switch between *Best Value*, *Cheapest First*, *Fastest Flight*, and *Fewest Stops* with zero page reloads.

---

### 5. Airline Fare Comparison Matrix
- **Functionality:**
  - Aggregates operating carriers for the chosen route.
  - Displays carrier name, lowest starting fare, price difference relative to the overall route minimum, direct service availability, and number of daily departures.

---

### 6. Multi-Passenger Booking & Mock Card Payment
- **Endpoint:** `POST /api/v1/bookings`
- **Frontend Page:** `/checkout/:flightId`
- **Functionality:**
  - Dynamically renders passenger forms for 1–9 passengers (Full Name as on passport, Age, Gender, Passport ID, Assigned Seat).
  - **Simulated Card Checkout:** Live credit card visualizer formatting card numbers with 4-digit Luhn spacing, expiration date, and CVV masking.
  - Safe sandbox simulation: no real payment card data is persisted to the database.

---

### 7. Guaranteed Unique 6-Char PNR Generation
- **Functionality:**
  - Generates an uppercase alphanumeric 6-character PNR code (e.g. `EJSA7V`, `SB8K2P`), excluding ambiguous characters (`O`, `0`, `I`, `1`).
  - Verifies uniqueness against existing database records prior to committing.
  - Emits the confirmed booking with total amount paid, status `CONFIRMED`, and generates a simulated `Transaction` settlement reference.

---

### 8. Automated WhatsApp Telemetry Dispatch
- **Endpoint:** Handled via FastAPI `BackgroundTasks`
- **Functionality:**
  - Dispatches a structured confirmation message via **Twilio WhatsApp API (sandbox)**:
    ```
    ✈️ SkyBook Flight Confirmation
    Dear Eleanor Vance,
    Your flight booking is confirmed!
    📌 PNR: EJSA7V
    🛫 Route: COK ➔ DXB
    ✈️ Airline: Air India Express (IX-679)
    📅 Date: 2026-10-15 at 06:00
    💰 Total Paid: ₹12,600.00
    ```
  - Logs status (`SENT`, `FAILED`, `QUEUED`), message payload, and Twilio SID in `whatsapp_logs`.
  - Non-blocking: booking succeeds instantly even if the WhatsApp delivery is offline.

---

### 9. My Bookings & Boarding Pass Viewer
- **Endpoint:** `GET /api/v1/bookings/me`, `GET /api/v1/bookings/{pnr}`
- **Frontend Page:** `/my-bookings`
- **Functionality:**
  - Allows travelers to view all their confirmed itineraries.
  - Click **View E-Ticket & Pass** to pop open the digital boarding pass modal showing PNR, seat numbers, route details, and WhatsApp dispatch confirmation.

---

### 10. Admin 360° User Engagement & Transaction Audit
- **Endpoint:** `GET /api/v1/admin/users/{user_id}/engagement`
- **Frontend Page:** `/admin` ➔ **Users Tab** ➔ **View Engagement (360°) →**
- **Functionality:**
  - Admins can inspect any user to view:
    - **User Bio:** Name, username, WhatsApp contact, joined date, role.
    - **Lifetime KPIs:** Total Searches, Total Bookings, Lifetime Value (Gross Revenue in ₹).
    - 💳 **Transactions Tab:** Complete audit of every payment transaction (Reference, Booking ID, Amount, Card Last 4, Status, Timestamp).
    - ✈️ **Bookings Tab:** Every confirmed PNR, route, carrier, travel date, and status.
    - 🔎 **Search Queries Tab:** Historical search inquiries with corridor, date, pax, and client IP.
    - 🛡️ **Login History Tab:** Complete security login log (timestamp, success/fail, IP, user-agent).

---

### 11. Airspace Telemetry & Route Bar Chart
- **Endpoint:** `GET /api/v1/admin/stats`
- **Frontend Page:** `/admin`
- **Functionality:**
  - **KPI Summary Cards:** Total Users, Searches Today, Total Bookings, Gross Settled Revenue.
  - **Interactive Bar Chart:** Dynamic route comparison component displaying top routes by Bookings, Searches, or Settled Revenue with smooth gradient bars.
  - **Paginated & Searchable Tables:** Dedicated tabs with real-time filters for Bookings, Users, Transactions, Login Audit Logs, and Search Logs.

---

## ⚡ How to Run With One Command (Docker)

To start the entire platform with PostgreSQL, FastAPI, and React in containers:

```bash
docker compose up -d --build
```

- **Frontend Application:** [http://localhost:5173](http://localhost:5173)
- **FastAPI Interactive Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **OpenAPI Schema:** [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

---

## 🛠️ Running Locally Without Docker

### Step 1: Run Backend
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
*(The backend creates all tables and provisions `admin` / `Admin@123` automatically. If PostgreSQL is not active, it uses `sqlite:///./skybook.db` with zero configuration).*

### Step 2: Run Frontend
```powershell
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

---

## 🧪 Running Pytest Unit Tests

Unit tests validate auth, login rate limits, corridor validations, PNR uniqueness, and passenger relations:

```powershell
cd backend
python -m pytest tests/ -v
```

Output:
```
tests/test_auth.py::test_register_and_login_flow PASSED
tests/test_auth.py::test_login_invalid_password PASSED
tests/test_auth.py::test_invalid_whatsapp_number_format PASSED
tests/test_booking.py::test_booking_and_pnr_uniqueness PASSED
tests/test_search.py::test_valid_flight_search PASSED
tests/test_search.py::test_invalid_origin_airport_rejected PASSED
tests/test_search.py::test_invalid_destination_rejected PASSED
======================== 7 passed in 5.67s ========================
```

---

## 🗄️ Database Schema (8 Relational Tables)

| Table | Description |
| :--- | :--- |
| `users` | Accounts, bcrypt password hashes, full names, E.164 phone numbers, roles (`user`, `admin`). |
| `login_logs` | Audit record of every login attempt with IP, user-agent, success boolean, and timestamp. |
| `search_logs` | Historical record of every flight search query with origin, destination, date, pax, and IP. |
| `flights` | Persisted flight itineraries with UUID, pricing, duration, stops, layover details, and tags. |
| `bookings` | Confirmed bookings with 6-char unique PNR, user FK, flight FK, contact info, and amount. |
| `passengers` | Passenger details per booking (name, age, gender, passport ID, seat assignment). |
| `transactions` | Simulated financial settlements (unique reference, amount, card last 4, status). |
| `whatsapp_logs` | Audit of all Twilio WhatsApp message deliveries (booking ID, phone, status, SID). |

---

## 🔒 Security & Environment Variables

- `.env` is **strictly ignored by git** via `.gitignore` to protect all API keys and credentials.
- Copy `.env.example` to `.env` to configure your environment:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/skybook_db
JWT_SECRET_KEY=your_jwt_secret_key_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin@123
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

---

## 🌐 100% Free Cloud Deployment Guide

You can host both the Backend and Frontend online for free using **Render** and **Vercel**:

### Option 1: 1-Click Render Blueprint (Backend + Frontend)
1. Go to [Render Dashboard](https://dashboard.render.com) and click **New +** ➔ **Blueprint**.
2. Connect your GitHub repository `noorfathimamusthafac/flight`.
3. Render reads `render.yaml` and deploys:
   - **`skybook-backend`**: Free Python Web Service running FastAPI.
   - **`skybook-frontend`**: Free Static Site running Vite React with client SPA routing.
4. Click **Apply**! Your site is live with an active URL in ~3 minutes.

### Option 2: Render (Backend) + Vercel (Frontend)
1. **Deploy Backend on Render:**
   - Click **New +** ➔ **Web Service** ➔ connect repo.
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Copy your Render backend URL (e.g. `https://skybook-backend.onrender.com`).
2. **Deploy Frontend on Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com) ➔ **Add New Project** ➔ import repo.
   - Root Directory: Select `frontend`.
   - In **Environment Variables**, add:
     - `VITE_API_URL` = `https://skybook-backend.onrender.com`
   - Click **Deploy**!

