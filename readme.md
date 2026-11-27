<div align="center">

# RedAid

**A blood donation platform that connects patients, donors and blood banks across Bangladesh.**

[Live Demo](https://redaid-frontend.vercel.app/) · [API](https://redaid-backend.vercel.app/) · [Report a Bug](https://github.com/SajidSojib/RedAid/issues)

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5%2B-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)

![RedAid home page](docs/images/hero.png)

</div>

---

## Overview

Finding the right blood type quickly is hard, and most requests spread through social media with no verification. RedAid replaces that with a structured workflow:

- **Patients and families** post a request and the right donors are alerted automatically.
- **Donors** register once, choose the areas they can serve, and respond when their blood type is needed nearby.
- **Blood banks** publish live inventory and handle incoming requests.
- **Admins** verify banks, review reports and manage the platform.

Matching is area-based (division, district, upazila, union) and respects a 90-day donation gap, so alerts only reach donors who can actually help.

## Features

### For donors and requesters
- Create blood requests (up to 15 bags, urgency levels) that notify every eligible, compatible donor in the area, with an automatic widening from union to upazila when nobody is found
- One account works as both donor and requester
- Accept, decline or withdraw from offers, or volunteer for any open request ("I can donate")
- Requester dashboard to confirm donations, mark no-shows, edit, complete or cancel requests
- Eligibility tracking with a 90-day rest period and a clear reason whenever an action is blocked
- Points, badges (Bronze to Platinum) and printable certificates with a public QR verification page
- Public leaderboard, filterable by area

### For blood banks
- Registration with admin verification before going public
- Inventory management by blood type with low-stock and out-of-stock indicators
- Incoming request queue: approve, reject, complete or mark no-show, with stock checked and deducted automatically
- Overview dashboard with weekly trends and stock charts

### For admins
- Bank verification workflow: verify, reject, revoke, suspend and reinstate, with reasons
- Report system between users who actually worked together, with an **AI-generated summary** of large report sets
- User suspension with automatic cleanup of open requests, offers and bank requests
- Location management (add and edit divisions, districts, upazilas, unions)
- Platform overview with growth, demand-versus-supply and request-outcome charts

### Platform
- Role-based access (`USER`, `BANK`, `ADMIN`) enforced in the API and the frontend proxy
- Read-only mode for suspended accounts (they can log in and view, but not act)
- In-app notifications with optimistic read state
- Light and dark themes
- Responsive layout, reduced-motion support

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui (Base UI), TanStack Form, Zod, Recharts, Sonner, Lucide |
| Backend | Node.js, Express 5, TypeScript (ESM), Better Auth, Nodemailer |
| Database | PostgreSQL on Neon, Prisma 7 with the `pg` adapter |
| AI | Groq API (report summarization) |
| Media | imgbb (profile photos) |
| Hosting | Vercel (frontend and backend as separate projects), Neon |

## Architecture

```mermaid
flowchart LR
    U[Browser] --> FE[Next.js frontend<br/>Server Components + Server Actions]
    FE -->|cookie forwarded<br/>JSON over HTTPS| API[Express API<br/>Vercel serverless]
    API --> AUTH[Better Auth<br/>cookie sessions]
    API --> DB[(PostgreSQL<br/>Neon)]
    API --> MAIL[Gmail SMTP<br/>verification emails]
    API --> AI[Groq API<br/>report summaries]
    FE --> IMG[imgbb<br/>image upload]
```

**Key design decisions**
- **Server-first frontend.** Pages are server components that fetch through one helper (`authedRequest`), which forwards the session cookie and returns `{ data, error }`. Interactivity lives in small client components (filters, dialogs, charts).
- **Thin server actions.** Mutations call the service, then expire the relevant cache tags with `updateTag`, so lists update without a full page refresh.
- **Race-safe writes.** Status changes use guarded `updateMany` inside transactions (for example claiming the last donor slot), so concurrent users cannot corrupt counts.
- **Separate domains.** Donor requests and blood bank requests are different tables with different state machines, instead of one overloaded table.

### Donor request flow

```mermaid
flowchart TD
    A[Requester creates request] --> B{Eligible donors<br/>in the union?}
    B -->|yes| C[Notify matching donors]
    B -->|no| D[Widen to whole upazila]
    D --> C
    C --> E[Donor accepts / volunteers]
    E --> F{All bags claimed?}
    F -->|yes| G[Status: FULFILLED]
    F -->|no| H[Status: OPEN]
    G --> I[Donor donates]
    H --> I
    I --> J[Requester confirms donation]
    J --> K[+1 point, badge check,<br/>90-day rest starts]
    K --> L{Confirmed donations<br/>= bags needed?}
    L -->|yes| M[Status: COMPLETED]
    L -->|no| H
    E -.->|donor withdraws<br/>or no-show| H
```

### Blood bank request flow

```mermaid
stateDiagram-v2
    [*] --> PENDING: user requests (max 3 active)
    PENDING --> APPROVED: bank approves
    PENDING --> REJECTED: bank rejects
    PENDING --> CANCELLED: another bank approved the user
    PENDING --> WITHDRAWN: user withdraws
    APPROVED --> FULFILLED: bank completes (stock deducted)
    APPROVED --> NO_SHOW: user never collected
    APPROVED --> WITHDRAWN: user withdraws
```

## Database design

> Key fields only. See `backend/prisma/schema` for the full definition.

```mermaid
erDiagram
    USER ||--o{ DONOR_SERVICE_AREA : serves
    USER ||--o{ DONATION_REQUEST : creates
    USER ||--o{ DONATION_MATCH : receives
    USER ||--o{ DONATION_HISTORY : has
    USER ||--o| BLOOD_BANK : owns
    USER ||--o{ BANK_REQUEST : makes
    USER ||--o{ ACHIEVEMENT : earns
    USER ||--o{ NOTIFICATION : gets
    USER ||--o{ REPORT : files
    USER ||--o{ REPORT : "is reported in"

    DIVISION ||--o{ DISTRICT : contains
    DISTRICT ||--o{ UPAZILA : contains
    UPAZILA ||--o{ UNION : contains
    UPAZILA ||--o{ DONOR_SERVICE_AREA : "chosen in"
    UPAZILA ||--o{ DONATION_REQUEST : "needed in"
    UPAZILA ||--o{ BLOOD_BANK : "located in"

    DONATION_REQUEST ||--o{ DONATION_MATCH : notifies
    DONATION_MATCH ||--o| DONATION_HISTORY : "confirmed as"
    DONATION_REQUEST |o--o{ BANK_REQUEST : "linked to"

    BLOOD_BANK ||--o{ BLOOD_INVENTORY : stocks
    BLOOD_BANK ||--o{ BANK_REQUEST : receives
    BLOOD_BANK ||--o{ REPORT : "is reported in"

    USER {
        string id PK
        string email
        enum role "USER | BANK | ADMIN"
        enum status "ACTIVE | SUSPENDED"
        enum bloodType
        date lastDonationDate
        int donationCount
    }
    DONATION_REQUEST {
        string id PK
        enum bloodType
        int unitsNeeded
        int unitsAccepted
        enum urgency
        enum status
    }
    DONATION_MATCH {
        string id PK
        enum status
        datetime respondedAt
    }
    BLOOD_BANK {
        string id PK
        string licenseNumber
        enum verificationStatus
    }
    BLOOD_INVENTORY {
        string bankId PK
        enum bloodType PK
        int unitsAvailable
    }
    BANK_REQUEST {
        string id PK
        enum bloodType
        int unitsRequested
        enum status
    }
    REPORT {
        string id PK
        enum category
        string reason
        enum status
    }
```

## Project structure

```
.
├── backend/
│   ├── prisma/                 # schema and migrations
│   ├── src/
│   │   ├── app.ts              # Express app (exported for serverless)
│   │   ├── server.ts           # local dev entry (listen)
│   │   ├── index.ts            # Vercel entry
│   │   ├── lib/                # auth, prisma client
│   │   ├── middlewares/        # auth, optionalAuth, requireActiveUser, ...
│   │   ├── module/<name>/      # service, controller, route per domain
│   │   ├── script/             # seed scripts
│   │   └── utils/
│   └── vercel.json
└── frontend/
    ├── src/
    │   ├── app/                # (auth), (main), (dashboardLayout)/@user|@bank|@admin
    │   ├── components/         # ui, common, and feature folders
    │   ├── service/            # API calls returning { data, error }
    │   ├── action/             # server actions that expire cache tags
    │   ├── routes/             # dashboard route map (single source of truth)
    │   ├── lib/
    │   └── proxy.ts            # session and role guard for /dashboard
    └── .env            
```

## API overview

Base URL: `https://redaid-backend.vercel.app/api`. Responses use `{ success, message, data }`.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register/user`, `/auth/register/bank`, `/auth/login`, `/auth/logout`, Better Auth routes |
| Locations | `GET /location/divisions` and nested children, admin `GET/POST/PATCH /location/admin/...` |
| Requests | `POST /requests`, `GET /requests` (public feed), `GET /requests/my`, `PATCH /requests/:id`, `/cancel`, `/complete` |
| Matches | `GET /matches/my-offers`, `PATCH /matches/:id/accept`, `/decline`, `/withdraw`, `/cancel-no-show`, `POST /matches/requests/:id/volunteer` |
| Donations | `PATCH /donations/matches/:id/confirm`, `GET /donations/my` |
| Banks | `GET /banks`, admin `PATCH /banks/:id/verify`, `/reject`, `/suspend`, `/reinstate` |
| Inventory | `GET/PATCH /inventory/my` |
| Bank requests | `POST /bank-requests`, `GET /bank-requests/my`, `/incoming`, `PATCH /bank-requests/:id/approve`, `/reject`, `/complete`, `/no-show`, `/withdraw` |
| Reports | `POST /reports`, `GET /reports/eligibility`, admin `GET /reports`, `/summary`, `PATCH /reports/:id/dismiss` |
| Users | admin `GET /users`, `PATCH /users/:id/suspend`, `/reactivate` |
| Other | `/profile`, `/notifications`, `/achievements`, `/leaderboard`, `/overview/bank`, `/overview/admin` |


## Getting started

### Prerequisites
- Node.js 22 or newer
- pnpm
- A PostgreSQL database (a free [Neon](https://neon.tech) project works)
- A Gmail account with an app password (for verification emails)
- A [Groq](https://console.groq.com) API key (optional, for AI report summaries)

### 1. Clone

```bash
git clone https://github.com/SajidSojib/RedAid
cd RedAid
```

### 2. Backend

```bash
cd backend
pnpm install
cp .env.example .env     # then fill in the values below
pnpm prisma migrate deploy --config prisma7.config.ts
pnpm prisma generate --config prisma7.config.ts
pnpm seed:locations      # divisions, districts, upazilas, unions
pnpm seed:admin          # creates the admin account
pnpm dev                 # http://localhost:8000
```

`backend/.env`

```env
PORT=8000
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
BETTER_AUTH_SECRET=change-me
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
ADMIN_NAME=admin-name
ADMIN_EMAIL=admin-gmail.gmail.com
ADMIN_PASSWORD=admin-password
ADMIN_ROLE = "ADMIN"
ADMIN_IMAGE=optional
ADMIN_PHONE=optional
ADMIN_BLOOD_TYPE="A_POSITIVE"
APP_EMAIL=your-gmail@gmail.com
APP_PASS=gmail-app-password
GEMINI_API_KEY=optional
GROQ_API_KEY=optional
```

### 3. Frontend

```bash
cd frontend
pnpm install
cp .env.example .env.local
pnpm dev                 # http://localhost:3000
```

`frontend/.env.local`

```env
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
API_URL=http://localhost:8000/api
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_IMGBB_KEY=your-key
NEXT_PUBLIC_IMG_UPLOAD_URL=https://api.imgbb.com/1/upload
```

### Optional: demo data

```bash
cd backend
pnpm seed:demo           # sample donors, banks, requests, reports
pnpm seed:demo:reset     # remove and rebuild the sample data
```

## Deployment

The repo is deployed as two Vercel projects, one per folder (set **Root Directory** to `backend` or `frontend`).

- **Backend:** `tsup` bundles `src/index.ts` into `api/index.js`, and `vercel.json` rewrites all paths to it. Session cookies use `SameSite=None; Secure` because the frontend and API live on different domains.
- **Frontend:** standard Next.js build. `API_URL` must point at the deployed API (ending in `/api`).
- **Database:** Neon Postgres. Use the pooled connection string for the app and apply migrations with `prisma migrate deploy`.

## Security and data handling

- Session cookies, email verification required before login
- Role checks on every route, plus `requireActiveUser` and `requireActiveBank` middleware that block writes for suspended accounts
- Reports are limited to people who worked together, with per-user daily limits
- Contact details unlock only after a donor accepts a request
- AI summaries send only report text, category and date (no names or contact details), and treat report text as untrusted input
- Input validation on every endpoint; race conditions handled with transactional, guarded updates

## Roadmap

- [ ] Scheduled jobs (request expiry, "eligible again" reminders) with Vercel Cron
- [ ] API rate limiting
- [ ] Automatic withdrawal of linked bank requests when a donor request closes
- [ ] SMS or push notifications
- [ ] Automated tests and CI

## Screenshots

| Home |
|---|
| ![Home](docs/images/home.png) |

| All requests | My Donations |
|---|---|
| ![All requests](docs/images/all-requests.png) | ![My Donations](docs/images/my-donations.png) |

| Bank overview | Admin overview |
|---|---|
| ![Bank overview](docs/images/bank-overview.png) | ![Admin overview](docs/images/admin-overview.png) |

## Author

**Sajid Ahmed Sojib**
[Portfolio](https://sajid-portfolio09.netlify.app/) · [GitHub](https://github.com/SajidSojib) · [LinkedIn](https://www.linkedin.com/in/sajid-ahmed-sojib) · sajidahmed2401@gmail.com

## License

This project is licensed under the [MIT License](LICENSE).