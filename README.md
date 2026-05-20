# Background Verification Platform

A secure, production-ready BGV (Background Verification) platform for
organizations and recruiters. Add candidates, run mock Aadhaar + PAN
verifications, and generate professional PDF reports — all from a single
dashboard.

## Features

- Secure authentication with JWT (7-day expiry) and bcrypt-hashed passwords
- Candidate CRUD with strict ownership checks (users only see their own data)
- Mock Aadhaar + PAN verification endpoints that simulate a real KYC provider
- Verification workflow that runs both checks, persists the full audit log,
  and computes an overall `VERIFIED / PARTIAL / FAILED / PENDING` status
- PII masking — Aadhaar is always returned as `XXXX-XXXX-1234`; raw numbers
  never leave the database
- Professional PDF reports rendered via Puppeteer with a clean, branded layout
- Optional Redis layer for dashboard-stats caching + cluster-wide rate limiting
- Dashboard with stat cards and a Recharts breakdown
- Searchable, paginated candidate list with status filters
- Candidate detail view with verification timeline and expandable raw payloads

## Tech Stack

**Backend**

- Node.js + Express (TypeScript, strict mode)
- Prisma ORM + PostgreSQL
- JWT (`jsonwebtoken`) + `bcryptjs`
- Zod for request validation
- Helmet, CORS, `express-rate-limit` (Redis-backed when configured) for hardening
- `ioredis` for caching + distributed rate limit storage (optional)
- Puppeteer for HTML → PDF generation
- Axios (used internally to call the mock APIs)

**Frontend**

- React 18 + Vite (TypeScript)
- Tailwind CSS with a custom brand palette
- React Router v6
- React Hook Form + Zod
- Zustand (persisted) for auth state
- Recharts for the dashboard chart
- Lucide React for icons

## Prerequisites

- Node.js 18+ (20 LTS recommended)
- PostgreSQL 13+ — either local, Neon, or Supabase
- Redis 6+ (optional — caching + rate-limit store; the app runs fine without it)
- npm 9+ (or pnpm / yarn — `npm` is what the docs assume)

## Setup Instructions

### Backend Setup

```bash
cd backend
cp .env.example .env       # fill in DATABASE_URL and JWT_SECRET
npm install
npm run prisma:generate
npm run prisma:migrate     # creates the initial migration
npm run dev                # http://localhost:5050

# (macOS uses port 5000 for AirPlay Receiver — that's why we default to 5050.)
```

### Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                # http://localhost:5173
```

### Redis Setup (optional)

```bash
# macOS
brew install redis
brew services start redis     # listens on localhost:6379

# Docker (any platform)
docker run -d -p 6379:6379 --name bgv-redis redis:7-alpine
```

Then set `REDIS_URL=redis://localhost:6379` in `backend/.env`. Without it
the app falls back to an in-memory rate limiter and skips caching — both
fine for local dev. `GET /health` reports the Redis status.

### Database Setup

The Prisma schema lives at `backend/prisma/schema.prisma`. After editing
the schema, run:

```bash
cd backend
npm run prisma:migrate -- --name <descriptive_name>
```

If you're using a hosted Postgres (Neon / Supabase), just paste the
provided connection string into `DATABASE_URL` and the migrate command
will work the same way.

## Environment Variables

### backend/.env

| Variable          | Description                                     | Example                                                  |
| ----------------- | ----------------------------------------------- | -------------------------------------------------------- |
| `DATABASE_URL`    | Postgres connection string                      | `postgresql://user:pw@localhost:5432/bgv_db`             |
| `JWT_SECRET`      | Long random string used to sign JWTs            | `a-very-long-random-string`                              |
| `PORT`            | Backend listen port                             | `5000`                                                   |
| `NODE_ENV`        | `development` or `production`                   | `development`                                            |
| `FRONTEND_ORIGIN` | Allowed CORS origin (frontend dev URL)          | `http://localhost:5173`                                  |
| `REDIS_URL`       | Redis connection URL (optional)                 | `redis://localhost:6379`                                 |
| `AADHAAR_API_URL` | URL the verification service hits for Aadhaar  | `http://localhost:5050/mock-api/aadhaar/verify`          |
| `PAN_API_URL`     | URL the verification service hits for PAN      | `http://localhost:5050/mock-api/pan/verify`              |

### frontend/.env

| Variable             | Description                | Example                       |
| -------------------- | -------------------------- | ----------------------------- |
| `VITE_API_BASE_URL`  | Backend API base URL       | `http://localhost:5050/api`   |

## API Endpoints

All `/api/*` endpoints (except `auth`) require a `Bearer <token>` header.

| Method | Path                                  | Auth | Description                                     |
| ------ | ------------------------------------- | ---- | ----------------------------------------------- |
| POST   | `/api/auth/register`                  | No   | Create a new user                               |
| POST   | `/api/auth/login`                     | No   | Sign in, returns `{ token, user }`              |
| GET    | `/api/candidates`                     | Yes  | List candidates (supports `?search=&status=`)   |
| GET    | `/api/candidates/stats`               | Yes  | Aggregate counts for the dashboard              |
| POST   | `/api/candidates`                     | Yes  | Create a candidate                              |
| GET    | `/api/candidates/:id`                 | Yes  | Get a candidate + verification logs             |
| PUT    | `/api/candidates/:id`                 | Yes  | Update a candidate                              |
| DELETE | `/api/candidates/:id`                 | Yes  | Delete a candidate                              |
| POST   | `/api/verifications/:candidateId/start` | Yes | Run Aadhaar + PAN verification                  |
| GET    | `/api/reports/:candidateId`           | Yes  | Download the PDF report                         |
| POST   | `/mock-api/aadhaar/verify`            | No   | Mock Aadhaar verification (internal)            |
| POST   | `/mock-api/pan/verify`                | No   | Mock PAN verification (internal)                |
| GET    | `/health`                             | No   | Liveness check                                  |

## Database Schema

```
User
  id            uuid     pk
  name          string
  email         string   unique
  passwordHash  string
  createdAt     datetime
  candidates    Candidate[]

Candidate
  id              uuid     pk
  fullName        string
  email           string
  phone           string
  aadhaarNumber   string   (raw, never returned via API)
  panNumber       string
  dob             datetime
  address         string
  status          string   default "PENDING"
  createdAt       datetime
  updatedAt       datetime
  createdById     uuid     fk -> User.id
  verificationLogs VerificationLog[]

VerificationLog
  id                 uuid     pk
  candidateId        uuid     fk -> Candidate.id
  verificationType   "AADHAAR" | "PAN"
  requestPayload     json
  responsePayload    json
  verificationStatus "verified" | "failed"
  verifiedAt         datetime
```

## Running Tests

A formal test suite isn't bundled with this scaffold. To exercise the
API by hand:

```bash
# 1. Register + login
curl -X POST http://localhost:5050/api/auth/register \
  -H 'content-type: application/json' \
  -d '{"name":"Test","email":"test@example.com","password":"password123"}'

curl -X POST http://localhost:5050/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"test@example.com","password":"password123"}'

# 2. Create a candidate (replace <TOKEN>)
curl -X POST http://localhost:5050/api/candidates \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer <TOKEN>' \
  -d '{
    "fullName":"Jane Doe",
    "email":"jane@example.com",
    "phone":"9876543210",
    "aadhaarNumber":"123412341234",
    "panNumber":"ABCDE1234F",
    "dob":"1995-05-12",
    "address":"221B Baker Street"
  }'
```

## Screenshots

Run the app locally (`npm run dev` in both `backend/` and `frontend/`)
and visit `http://localhost:5173`. The branded auth screens, dashboard,
candidate list, candidate detail with timeline, and PDF report are all
available out of the box.

## Folder Structure

```
background-verification-platform/
├── backend/
│   ├── src/
│   │   ├── controllers/        # thin HTTP layer — calls services
│   │   ├── services/           # business logic, DB access
│   │   ├── routes/             # express routers
│   │   ├── middleware/         # auth, validation, error handler
│   │   ├── validations/        # Zod schemas
│   │   ├── utils/              # constants, jwt, maskers, helpers
│   │   ├── config/             # env, prisma client
│   │   ├── types/              # global type augmentations
│   │   ├── app.ts              # express app builder
│   │   └── server.ts           # entry point
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/              # one file per route
│   │   ├── components/         # shared UI bits
│   │   ├── layouts/            # AppLayout + AuthLayout
│   │   ├── services/           # axios calls grouped by resource
│   │   ├── store/              # zustand stores
│   │   ├── utils/              # constants + formatting helpers
│   │   ├── types/              # API response types
│   │   ├── styles/             # global Tailwind layer
│   │   ├── App.tsx             # router tree
│   │   └── main.tsx            # React entry point
│   ├── public/
│   ├── .env.example
│   └── package.json
│
└── README.md
```

## Security Notes

- JWT tokens expire after 7 days.
- Passwords are hashed with bcrypt (cost factor 12).
- Helmet sets sensible security headers on every response.
- CORS is restricted to `FRONTEND_ORIGIN` in production.
- A global rate limit (100 requests / 15 min / IP) plus a stricter
  limit on `/api/auth/*` blunts credential-stuffing attempts.
- All inputs are validated with Zod before they reach the DB.
- Prisma is used for every query — no raw SQL, no injection surface.
- Aadhaar numbers are stored raw (so we can re-verify) but are masked
  in every API response and in every log line.
- Ownership checks happen at the query level: users can only ever see
  candidates they created.

## License

For internal / educational use.
