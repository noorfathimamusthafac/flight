"""001_initial_tables

Revision ID: 001_initial_tables
Revises: 
Create Date: 2026-10-01 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_tables'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=64), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=128), nullable=False),
        sa.Column('whatsapp_number', sa.String(length=32), nullable=False),
        sa.Column('role', sa.String(length=16), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    op.create_index(op.f('ix_users_created_at'), 'users', ['created_at'], unique=False)

    # 2. login_logs
    op.create_table(
        'login_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('username', sa.String(length=64), nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.String(length=255), nullable=True),
        sa.Column('success', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_login_logs_id'), 'login_logs', ['id'], unique=False)
    op.create_index(op.f('ix_login_logs_user_id'), 'login_logs', ['user_id'], unique=False)
    op.create_index(op.f('ix_login_logs_username'), 'login_logs', ['username'], unique=False)
    op.create_index(op.f('ix_login_logs_created_at'), 'login_logs', ['created_at'], unique=False)

    # 3. search_logs
    op.create_table(
        'search_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('origin', sa.String(length=8), nullable=False),
        sa.Column('destination', sa.String(length=8), nullable=False),
        sa.Column('travel_date', sa.String(length=16), nullable=False),
        sa.Column('passengers', sa.Integer(), nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_search_logs_id'), 'search_logs', ['id'], unique=False)
    op.create_index(op.f('ix_search_logs_user_id'), 'search_logs', ['user_id'], unique=False)
    op.create_index(op.f('ix_search_logs_origin'), 'search_logs', ['origin'], unique=False)
    op.create_index(op.f('ix_search_logs_destination'), 'search_logs', ['destination'], unique=False)
    op.create_index(op.f('ix_search_logs_travel_date'), 'search_logs', ['travel_date'], unique=False)
    op.create_index(op.f('ix_search_logs_created_at'), 'search_logs', ['created_at'], unique=False)

    # 4. flights
    op.create_table(
        'flights',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('search_origin', sa.String(length=8), nullable=False),
        sa.Column('search_destination', sa.String(length=8), nullable=False),
        sa.Column('search_date', sa.String(length=16), nullable=False),
        sa.Column('airline', sa.String(length=64), nullable=False),
        sa.Column('flight_number', sa.String(length=32), nullable=False),
        sa.Column('departure_time', sa.String(length=16), nullable=False),
        sa.Column('arrival_time', sa.String(length=16), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=False),
        sa.Column('stops', sa.Integer(), nullable=False),
        sa.Column('layover_airport', sa.String(length=8), nullable=True),
        sa.Column('layover_duration_minutes', sa.Integer(), nullable=True),
        sa.Column('price_inr', sa.Float(), nullable=False),
        sa.Column('baggage', sa.String(length=64), nullable=True),
        sa.Column('seats_available', sa.Integer(), nullable=True),
        sa.Column('aircraft', sa.String(length=64), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('price_diff_vs_cheapest', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_flights_search_origin'), 'flights', ['search_origin'], unique=False)
    op.create_index(op.f('ix_flights_search_destination'), 'flights', ['search_destination'], unique=False)
    op.create_index(op.f('ix_flights_search_date'), 'flights', ['search_date'], unique=False)
    op.create_index(op.f('ix_flights_airline'), 'flights', ['airline'], unique=False)
    op.create_index(op.f('ix_flights_created_at'), 'flights', ['created_at'], unique=False)

    # 5. bookings
    op.create_table(
        'bookings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('pnr', sa.String(length=6), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('flight_id', sa.String(length=36), nullable=False),
        sa.Column('total_amount', sa.Float(), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('travel_date', sa.String(length=16), nullable=False),
        sa.Column('contact_phone', sa.String(length=32), nullable=False),
        sa.Column('contact_email', sa.String(length=128), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['flight_id'], ['flights.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_bookings_id'), 'bookings', ['id'], unique=False)
    op.create_index(op.f('ix_bookings_pnr'), 'bookings', ['pnr'], unique=True)
    op.create_index(op.f('ix_bookings_user_id'), 'bookings', ['user_id'], unique=False)
    op.create_index(op.f('ix_bookings_flight_id'), 'bookings', ['flight_id'], unique=False)
    op.create_index(op.f('ix_bookings_status'), 'bookings', ['status'], unique=False)
    op.create_index(op.f('ix_bookings_created_at'), 'bookings', ['created_at'], unique=False)

    # 6. passengers
    op.create_table(
        'passengers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('booking_id', sa.Integer(), nullable=False),
        sa.Column('full_name', sa.String(length=128), nullable=False),
        sa.Column('age', sa.Integer(), nullable=False),
        sa.Column('gender', sa.String(length=16), nullable=False),
        sa.Column('passport_number', sa.String(length=32), nullable=True),
        sa.Column('seat_number', sa.String(length=8), nullable=True),
        sa.ForeignKeyConstraint(['booking_id'], ['bookings.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_passengers_id'), 'passengers', ['id'], unique=False)
    op.create_index(op.f('ix_passengers_booking_id'), 'passengers', ['booking_id'], unique=False)

    # 7. transactions
    op.create_table(
        'transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('booking_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('reference', sa.String(length=64), nullable=False),
        sa.Column('payment_method', sa.String(length=32), nullable=False),
        sa.Column('card_last4', sa.String(length=4), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['booking_id'], ['bookings.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_transactions_id'), 'transactions', ['id'], unique=False)
    op.create_index(op.f('ix_transactions_booking_id'), 'transactions', ['booking_id'], unique=False)
    op.create_index(op.f('ix_transactions_reference'), 'transactions', ['reference'], unique=True)
    op.create_index(op.f('ix_transactions_status'), 'transactions', ['status'], unique=False)
    op.create_index(op.f('ix_transactions_created_at'), 'transactions', ['created_at'], unique=False)

    # 8. whatsapp_logs
    op.create_table(
        'whatsapp_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('booking_id', sa.Integer(), nullable=True),
        sa.Column('phone_number', sa.String(length=32), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=16), nullable=False),
        sa.Column('twilio_sid', sa.String(length=64), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['booking_id'], ['bookings.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_whatsapp_logs_id'), 'whatsapp_logs', ['id'], unique=False)
    op.create_index(op.f('ix_whatsapp_logs_booking_id'), 'whatsapp_logs', ['booking_id'], unique=False)
    op.create_index(op.f('ix_whatsapp_logs_status'), 'whatsapp_logs', ['status'], unique=False)
    op.create_index(op.f('ix_whatsapp_logs_created_at'), 'whatsapp_logs', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_table('whatsapp_logs')
    op.drop_table('transactions')
    op.drop_table('passengers')
    op.drop_table('bookings')
    op.drop_table('flights')
    op.drop_table('search_logs')
    op.drop_table('login_logs')
    op.drop_table('users')
