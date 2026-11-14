Sweety — Blood Glucose Tracker

A full-stack web application for diabetes patients to record up to four structured blood glucose readings per day, track trends across the month, review daily and monthly summary statistics, and optionally share read-only reports with an assigned doctor.

Project Overview

Sweety provides a focused, clinical-grade logbook built with a Node.js + Express REST API, PostgreSQL (with an optional Cloud Firestore adapter), and a React + TypeScript frontend. Users register and sign in with bcrypt-hashed credentials, manage their own private glucose logs, and inspect summary reports calculated across daily, month-to-date, and prior-month windows.

Features

User Authentication & Data Isolation
Register with name, email, and password (passwords are hashed with bcryptjs and never stored in plain text).
Sign in using JWT bearer authentication; patients only view and mutate their own readings.
Blood Glucose Readings CRUD
Log, view, edit, and delete readings (date, slot, value in mg/dl) across four daily slots:
Morning (fasting)
After breakfast
After lunch
After dinner
Shared Client & Server Validation:
Required value: "Please enter a glucose value."
Whole number between 40 and 600: "Value must be between 40 and 600 mg/dl."
One reading per slot per day: "You already have a(n) <Slot> reading for this date."
Maximum 4 readings per day: "You can add only 4 readings per day."
No future dates: "Date cannot be in the future."
Summary Reports & Visualization
Daily Report (selected date, e.g. 15 Oct 2026): highest, lowest, average (rounded to 1 decimal), reading count, plus the slot-by-slot reading list.

Month-to-Date Report (1st of selected month through selected date, e.g. 1 Oct – 15 Oct 2026).
Monthly Report (whole previous calendar month, e.g. 1 Sep – 30 Sep 2026, including January → December year rollover).
Friendly empty states whenever a period has no logged readings.
Interactive Recharts monthly glucose trend line/area chart with clinical target reference lines (70, 140, and 180 mg/dl).

Additional Capabilities
Paginated History: GET /api/readings?page=1&limit=20 with table pagination controls.
Report Caching: Server-side report cache keyed by userId:selectedDate that invalidates automatically on create, update, or delete.
Doctor Role: Patients can assign a doctor by email (Care team tab or at signup); doctors can view assigned patients' reports in read-only mode.
Docker Support: Dockerfile and docker-compose.yml for containerized PostgreSQL + Express/React deployment.

Tech Stack
Frontend: React 19, TypeScript, Vite, Tailwind CSS v4, Recharts, Lucide Icons
Backend: Node.js, Express 4, TypeScript (tsx), bcryptjs, jsonwebtoken
Database: PostgreSQL (pg) with optional Cloud Firestore persistence adapter
Testing: Vitest, React Testing Library (@testing-library/react), Supertest
Containerization: Docker, Docker Compose

Installation
Clone the repository
Bash
git clone <your-repository-url>
cd sweety-blood-glucose-tracker
Install dependencies
Bash
npm install
Configure environment variables
Bash
cp .env.example .env

Edit .env to match your local PostgreSQL credentials and set a strong JWT_SECRET.
Environment Variables (.env.example)
Variable	Required	Default	Description
PORT	No	3000	HTTP port for the Express server and Vite dev middleware
NODE_ENV	No	development	Runtime environment (development, production, or test)
APP_URL	No	http://localhost:3000	Base URL where the application is served
JWT_SECRET	Yes (prod)	Dev fallback	Secret key used to sign and verify JWT session tokens
DATABASE_URL	Yes (Postgres)	—	PostgreSQL connection string (e.g. postgresql://sweety:sweety_password@localhost:5432/sweety)
PGHOST	Alternative	localhost	PostgreSQL host (used if DATABASE_URL is not provided)
PGPORT	Alternative	5432	PostgreSQL port
PGUSER	Alternative	sweety	PostgreSQL username
PGPASSWORD	Alternative	sweety_password	PostgreSQL password
PGDATABASE	Alternative	sweety	PostgreSQL database name
Database Setup (PostgreSQL + Optional Firestore)

Option A: PostgreSQL via Docker Compose (Recommended)
Start PostgreSQL using the included docker-compose.yml (which also initializes tables via postgres/init.sql):
Bash
docker compose up -d postgres
Or run the entire stack (PostgreSQL + production Node server):
Bash
docker compose up --build
Option B: Local PostgreSQL
Create a database named sweety and a user matching .env:
SQL
CREATE USER sweety WITH PASSWORD 'sweety_password';
CREATE DATABASE sweety OWNER sweety;
Apply the schema (also auto-created on first PgStore startup):
Bash
psql "$DATABASE_URL" -f postgres/init.sql

Option C: Optional Cloud Firestore Adapter
If neither DATABASE_URL nor PGHOST is set in the environment, backend/db/store.ts automatically falls back to FirestoreStore using the configured Firebase project credentials. This allows the app to persist data in environments without a local PostgreSQL instance while preserving the exact same DataStore repository interface.
Seed Script
Populate the database with one demo doctor, one demo patient, and sample blood glucose readings spanning the current and previous month:
Bash
npm run seed
The script (scripts/seed.ts) is idempotent—running it multiple times will not create duplicate demo users or readings.
Quick Demo Access
After seeding (or starting the server, which also runs an idempotent startup seed check), you can sign in immediately with these pre-seeded accounts or click the Quick demo access buttons on the login screen:
Demo Accounts
Role	Name	Email	Password
Patient	Alex Rivera	alex@sweety.health	Patient123!
Doctor	Dr. Maya Chen	dr.chen@sweety.health	Doctor123!
Alex Rivera is pre-assigned to Dr. Maya Chen so you can immediately verify both patient logging and doctor read-only reporting.
Running the Server
The Express server handles all /api/* endpoints and serves the React application on port 3000:
Bash
# Development mode (Express API + Vite dev middleware)
npm run dev

# Production build and start
npm run build
npm start
Running the Client
In development, npm run dev mounts Vite's middleware inside Express at http://localhost:3000, so both the React frontend and /api/* backend run under a single origin with no extra proxy configuration required.
If you want to run Vite standalone (for example, to inspect frontend bundling):
Bash
npx vite
To verify TypeScript compilation across both client and server:
Bash
npm run lint
Running Tests
Run the full Vitest suite (React Testing Library component tests + Supertest Express API integration tests):
Bash
npm test
What is covered:
src/components/ReadingForm.test.tsx: Verifies empty value errors, out-of-range/decimal rejection (40–600), duplicate slot prevention, max-4-readings-per-day enforcement, future date rejection, and editing an existing slot.
backend/api.test.ts: Verifies bcrypt password hashing, cross-user reading isolation (403 on another user's reading), all 5 validation rules on POST /api/readings, pagination, daily/month-to-date/monthly report calculations (including 1-decimal averages and January → December rollover), and doctor assigned-patient authorization.
Screenshots
Add captured screenshots to docs/screenshots/ and update the links below.
View	Screenshot Placeholder
Login	![Login Screen](docs/screenshots/login.png)
Dashboard	![Patient Dashboard](docs/screenshots/dashboard.png)
Add Reading	![Add Reading Modal](docs/screenshots/add-reading.png)
Reports	![Daily, Month-to-Date, and Monthly Reports](docs/screenshots/reports.png)
Doctor View	![Doctor Clinical View](docs/screenshots/doctor-view.png)

Project Structure
Text
.
├── backend/
│   ├── api.test.ts                 # Supertest + Vitest API & report integration tests
│   ├── app.ts                      # Express application factory
│   ├── config/
│   │   └── db.ts                   # Database initialization entrypoint
│   ├── controllers/
│   │   ├── authController.ts       # Register, login, profile, and doctor assignment
│   │   ├── doctorController.ts     # Assigned patients summary endpoint
│   │   └── readingsController.ts   # Readings CRUD, pagination, and report generation
│   ├── db/
│   │   └── store.ts                # DataStore interface + PgStore, FirestoreStore, MemoryStore
│   ├── middleware/
│   │   └── authMiddleware.ts       # JWT verification middleware
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── doctorRoutes.ts
│   │   └── readingsRoutes.ts
│   ├── services/
│   │   └── reportCache.ts          # Per-user report cache with mutation invalidation
│   └── utils/
│       └── validation.ts           # Backend auth & reading validation wrappers
├── postgres/
│   └── init.sql                    # PostgreSQL schema and constraints
├── scripts/
│   └── seed.ts                     # Standalone database seed script (`npm run seed`)
├── shared/
│   └── glucose.ts                  # Shared types, validation rules, and report calculations
├── src/
│   ├── App.tsx                     # Root session restoration and routing
│   ├── index.css                   # Tailwind CSS v4 theme and typography setup
│   ├── main.tsx                    # React entrypoint
│   ├── types.ts                    # Frontend type re-exports
│   ├── components/
│   │   ├── AuthScreen.tsx          # Sign in, registration, and quick demo access
│   │   ├── DailyBreakdown.tsx      # Slot-by-slot daily readings with edit/delete actions
│   │   ├── Dashboard.tsx           # Main patient & doctor dashboard shell
│   │   ├── GlucoseChart.tsx        # Recharts monthly glucose trend chart
│   │   ├── ReadingForm.tsx         # Add/edit reading modal form
│   │   ├── ReadingForm.test.tsx    # React Testing Library tests for ReadingForm
│   │   ├── ReadingsHistory.tsx     # Paginated chronological readings table
│   │   └── ReportCards.tsx         # Daily, Month-to-date, and Monthly summary cards
│   ├── services/
│   │   └── api.ts                  # Typed fetch client for /api/*
│   ├── test/
│   │   └── setup.ts                # Vitest + jest-dom setup
│   └── utils/
│       └── validation.ts           # Frontend validation exports
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── package.json
├── server.ts                       # Production/dev HTTP server entrypoint
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts

API Overview
All /api/readings*, /api/reports, /api/doctor/*, /api/auth/me, and /api/auth/doctor routes require an Authorization: Bearer <token> header.
Method	Endpoint	Description
GET	/api/health	Service health check ({ status: "ok" })
POST	/api/auth/register	Register a patient or doctor account (bcrypt hash)
POST	/api/auth/login	Authenticate user and return JWT + profile
GET	/api/auth/me	Fetch current user profile and registered doctors list
PUT	/api/auth/doctor	Assign or remove a patient's doctor
GET	/api/readings	List user readings with pagination (?page=1&limit=20&date=&month=&patientId=)
POST	/api/readings	Create a new glucose reading (enforces all 5 validation rules)
PUT	/api/readings/:id	Update an existing reading owned by the user
DELETE	/api/readings/:id	Delete a reading owned by the user
GET	/api/reports	Compute Daily, Month-to-Date, Monthly summaries & monthly chart data (?date=YYYY-MM-DD)
GET	/api/doctor/patients	List patients assigned to the authenticated doctor
Notes
Assumptions
Calendar Dates & Timezones: Glucose readings are stored as calendar dates (YYYY-MM-DD) without time-of-day timestamps because the domain groups entries by daily slot (Morning (fasting), After breakfast, After lunch, After dinner). The frontend sends the browser's local date via the X-Local-Date header, and the backend allows a ±1 day window relative to UTC when checking "Date cannot be in the future." so patients across timezones are not blocked around midnight.
Clinical Reference Ranges: Chart reference lines (70 mg/dl low, 140 mg/dl target, 180 mg/dl elevated/high) are general visual aids for reading trends and do not replace physician-specific targets.
Database Selection: PostgreSQL is the primary database when DATABASE_URL or PGHOST is configured; Cloud Firestore is available as a zero-config fallback via the shared DataStore abstraction.
Known Limitations
In-Memory Report Cache: backend/services/reportCache.ts stores cached reports in process memory rather than an external Redis cluster; running multiple horizontal backend replicas without sticky sessions would give each instance its own cache.
No Email Delivery / Background Reminder Queue: Password reset emails and scheduled daily reminder notifications (e.g., via BullMQ + Redis) are not currently wired up.
Single Doctor Assignment: Each patient account currently links to at most one assigned doctor at a time.
Future Improvements
Swap reportCache.ts to an external Redis store for multi-instance deployments.
Add a BullMQ daily reminder worker for patients with fewer than 4 readings logged by evening.
Support CSV / PDF export of monthly reports for clinic visits.
Add configurable per-patient glucose target thresholds (low / high bounds) set by the patient or their doctor.
