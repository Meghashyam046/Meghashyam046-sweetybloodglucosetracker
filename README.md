# Sweety – Blood Glucose Tracker

A blood glucose tracking web application built with **React (TypeScript), Node.js + Express, PostgreSQL / Cloud Firestore, and Recharts**. Patients can log up to 4 structured readings per day, edit or delete entries, inspect daily, month-to-date, and prior-month summary reports, and optionally share read-only reports with an assigned doctor.

---

## Features Implemented

### Core Requirements
- **Sign Up & Log In**: Register with name, email, and password (hashed with `bcryptjs`, never stored in plain text) and sign in using JWT bearer authentication. Users only see their own readings.
- **Readings CRUD**: Add, view, edit, and delete readings (`date`, `slot`, `value` in `mg/dl`) across the 4 daily slots:
  - `Morning (fasting)`
  - `After breakfast`
  - `After lunch`
  - `After dinner`
- **Strict Validation (Client + Server)**:
  - Value required: `"Please enter a glucose value."`
  - Whole number between 40 and 600: `"Value must be between 40 and 600 mg/dl."`
  - Max 4 readings per day: `"You can add only 4 readings per day."`
  - One reading per slot per day: `"You already have a(n) <Slot> reading for this date."`
  - No future dates: `"Date cannot be in the future."`
- **Reports**:
  - **Daily** (selected date, e.g. `15 Oct 2026`): highest, lowest, average (1 decimal), reading count, plus slot-by-slot reading breakdown.
  - **Month-to-date** (1st of month to selected date, e.g. `1 Oct – 15 Oct 2026`).
  - **Monthly** (whole previous calendar month, e.g. `1 Sep – 30 Sep 2026`, including January → December year rollover).
  - Friendly empty states when no readings exist in a period.

### Bonus Features Implemented
- **Pagination**: `GET /api/readings?page=1&limit=20` with paginated history table in the UI.
- **Charts**: Interactive Recharts area/line chart of glucose readings across the selected month with 70 / 140 / 180 mg/dl clinical reference lines.
- **Report Caching**: In-memory report cache keyed by `userId:selectedDate` that invalidates automatically whenever a reading is created, updated, or deleted.
- **Doctor Role**: Patients can assign a doctor by email (`Care team` tab or during registration); doctors can view assigned patients' daily, month-to-date, and monthly reports in read-only mode.
- **Docker + PostgreSQL**: `docker-compose.yml`, `Dockerfile`, and `postgres/init.sql` for running PostgreSQL + the app locally.
- **Tests**: React Testing Library tests (`src/components/ReadingForm.test.tsx`) and Express API integration tests (`backend/api.test.ts`).

---

## Persistence Assumption & Database Adapter

- **Local / Docker (`DATABASE_URL` or `PGHOST` set)**: `backend/db/store.ts` selects `PgStore` (`pg.Pool`), auto-initializes the `users` and `readings` tables with `CHECK` and `UNIQUE (user_id, date, slot)` constraints, and stores all records in PostgreSQL.
- **AI Studio Preview (when Cloud SQL is not enabled)**: `backend/db/store.ts` automatically uses `FirestoreStore` backed by the workspace's provisioned Cloud Firestore instance (`firebase-applet-config.json`), keeping the exact same repository contract (`DataStore`) so all features, bcrypt hashing, and per-user data isolation work seamlessly.
- **Tests (`NODE_ENV=test`)**: Uses `MemoryStore` for fast, deterministic unit and Supertest API tests.

---

## Demo Accounts

Pre-seeded on first startup:

| Role | Email | Password |
| :--- | :--- | :--- |
| Patient | `alex@sweety.health` | `Patient123!` |
| Doctor | `dr.chen@sweety.health` | `Doctor123!` |

---

## Development & Testing Commands

```bash
# Install dependencies
npm install

# Run development server (Express API + Vite on port 3000)
npm run dev

# Run TypeScript type check
npm run lint

# Run Vitest unit, React Testing Library, and Supertest API tests
npm test

# Run with PostgreSQL using Docker Compose
docker compose up --build
```
