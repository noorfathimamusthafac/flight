import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.models import User
from app.routers import auth, flights, bookings, admin

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("skybook")


def seed_admin_user():
    """Seeds the initial admin account on startup if it doesn't already exist."""
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.username == settings.ADMIN_USERNAME).first()
        if not admin_user:
            logger.info(f"Seeding default admin user: {settings.ADMIN_USERNAME}")
            hashed = get_password_hash(settings.ADMIN_PASSWORD)
            new_admin = User(
                username=settings.ADMIN_USERNAME,
                password_hash=hashed,
                full_name=settings.ADMIN_FULL_NAME,
                whatsapp_number=settings.ADMIN_WHATSAPP,
                role="admin",
                is_active=True
            )
            db.add(new_admin)
            db.commit()
            logger.info("Default admin user created successfully.")
    except Exception as e:
        logger.error(f"Error seeding admin user: {e}")
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist & seed admin
    logger.info("Starting up SkyBook Flight Booking Engine...")
    try:
        Base.metadata.create_all(bind=engine)
        seed_admin_user()
    except Exception as e:
        logger.error(f"Database initialization error on startup: {e}")
    yield
    # Shutdown
    logger.info("Shutting down SkyBook backend...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="SkyBook: Enterprise Flight Ticket Booking & Telemetry Platform",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handlers for consistent JSON responses
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        field = " -> ".join([str(loc) for loc in err.get("loc", [])])
        msg = err.get("msg", "Validation error")
        errors.append(f"{field}: {msg}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Validation error", "errors": errors}
    )


# Include API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(flights.router, prefix=settings.API_V1_STR)
app.include_router(bookings.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "app": "SkyBook API",
        "version": "1.0.0",
        "status": "online",
        "docs_url": "/docs"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
