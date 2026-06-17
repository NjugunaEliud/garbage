-- Run this SQL against your PostgreSQL database to initialise the schema.

CREATE TABLE IF NOT EXISTS buildings (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  location    TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id            SERIAL PRIMARY KEY,
  full_name     TEXT NOT NULL,
  phone_number  TEXT NOT NULL,
  building_id   INTEGER NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  room_number   TEXT NOT NULL,
  monthly_fee   NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id               SERIAL PRIMARY KEY,
  customer_id      INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  month            SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year             SMALLINT NOT NULL,
  amount           NUMERIC(10,2) NOT NULL DEFAULT 0,
  method           TEXT NOT NULL CHECK (method IN ('stk_push','manual_reference')),
  mpesa_reference  TEXT,
  phone_number     TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid','unpaid','partial')),
  paid_at          TIMESTAMPTZ DEFAULT NOW(),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (customer_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_month_year ON payments(month, year);
CREATE INDEX IF NOT EXISTS idx_customers_building ON customers(building_id);

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
