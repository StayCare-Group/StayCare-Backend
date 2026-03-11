# StayCare Backend

Backend API for the StayCare laundry management web application. Built with Express, TypeScript, and MongoDB. Uses JWT authentication with httpOnly cookies (access + refresh tokens).

## Tech stack

- **Runtime:** Node.js
- **Framework:** Express 5
- **Language:** TypeScript
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT (jsonwebtoken), bcryptjs, cookie-parser
- **Validation:** Zod
- **Email:** Nodemailer (SMTP)

## Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)
- npm or yarn

## Installation

```bash
npm install
```

## Environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | MongoDB connection string | `mongodb+srv://...` |
| `JWT_ACCESS_SECRET` | Yes | Secret for signing access tokens | Strong random string |
| `JWT_REFRESH_SECRET` | Yes | Secret for signing refresh tokens | Different strong random string |
| `PORT` | No | Server port (default: 5000) | `5000` |
| `NODE_ENV` | No | Runtime environment | `development` / `production` |
| `CLIENT_URL` | No | Allowed CORS origin (frontend URL) | `http://localhost:5173` |
| `ACCESS_TOKEN_EXPIRES` | No | Access token lifetime in seconds (default: 900) | `900` |
| `REFRESH_TOKEN_EXPIRES` | No | Refresh token lifetime in seconds (default: 604800) | `604800` |
| `SMTP_HOST` | No | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | No | SMTP server port | `587` |
| `SMTP_SECURE` | No | Use TLS (`true`/`false`) | `false` |
| `SMTP_USER` | No | SMTP username / email | `your-email@gmail.com` |
| `SMTP_PASS` | No | SMTP password / app password | `your-app-password` |
| `SMTP_FROM` | No | Sender address shown on emails | `StayCare <your-email@gmail.com>` |

> **Note:** `DATABASE_URL`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` are required — the server will exit on startup if any are missing.

**Security:** In production, use long random secrets and never commit `.env`. Set `NODE_ENV=production` so cookies use `secure: true`.

## Running the server

```bash
npm run dev
```

Starts the server with hot reload (default port from `PORT` or 5000). Connects to MongoDB on startup.

---

## Roles

The system has four roles:

| Role | Description |
|------|-------------|
| `admin` | Full access to all resources |
| `staff` | Operational access — manage clients, orders, routes, invoices, machines |
| `client` | Limited access — own profile, orders, invoices, and properties |
| `driver` | Can update route/order status during pickup and delivery |

---

## API overview

Base URL: `http://localhost:5000` (or your `PORT`).

All authenticated requests must send cookies (`credentials: 'include'` in fetch or `withCredentials: true` in axios). The frontend origin must match `CLIENT_URL`.

---

### Authentication (`/api/auth`)

Tokens are stored in **httpOnly cookies** only — never in the response body or localStorage.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register a new user (self-registration). |
| POST | `/api/auth/login` | No | Login. Sets `accessToken` and `refreshToken` cookies. |
| POST | `/api/auth/refresh` | No (refresh cookie) | Issue a new access token. |
| POST | `/api/auth/logout` | No (cookies) | Invalidate refresh token and clear cookies. |
| GET | `/api/auth/me` | Yes | Get the current user's profile. |
| PATCH | `/api/auth/me` | Yes | Update the current user's name, email, phone, or language. |
| PATCH | `/api/auth/password` | Yes | Change the current user's password. |
| POST | `/api/auth/forgot-password` | No | Send a password-reset email. |
| POST | `/api/auth/reset-password/:token` | No | Reset password using the emailed token. |

**Login request:**
```json
{ "email": "user@example.com", "password": "password123" }
```

**Login success (200):** Sets `accessToken` (15 min) and `refreshToken` (7 days) cookies and returns:
```json
{ "user": { "id": "...", "role": "admin", "email": "user@example.com", "name": "User Name" } }
```

**Errors:** `401` invalid credentials; `400` validation error.

---

### Users (`/api/users`)

Admin-managed user accounts (e.g. creating staff/driver accounts directly).

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/users` | admin | Create a user with a specified role. |
| GET | `/api/users` | admin, staff | List all users. |
| GET | `/api/users/:id` | admin, staff | Get a user by ID. |
| PUT | `/api/users/:id` | admin | Update a user. |
| DELETE | `/api/users/:id` | admin | Deactivate a user. |

---

### Clients (`/api/clients`)

Clients are the households or businesses that use the laundry service. Each client can have multiple service properties (pickup/delivery addresses).

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/clients` | admin, staff | Create a client. |
| GET | `/api/clients` | admin, staff | List all clients. |
| GET | `/api/clients/:id` | admin, staff, client | Get a client by ID. |
| PUT | `/api/clients/:id` | admin, staff | Update a client. |
| DELETE | `/api/clients/:id` | admin | Delete a client. |
| POST | `/api/clients/self` | admin, staff, client | Create a client profile for the current user. |
| POST | `/api/clients/:id/properties` | admin, staff | Add a property to a client. |
| PUT | `/api/clients/:id/properties/:propertyId` | admin, staff | Update a client's property. |
| DELETE | `/api/clients/:id/properties/:propertyId` | admin, staff | Remove a client's property. |
| POST | `/api/clients/self/properties` | client | Add a property to own client profile. |
| PUT | `/api/clients/self/properties/:propertyId` | client | Update own property. |
| DELETE | `/api/clients/self/properties/:propertyId` | client | Delete own property. |

---

### Orders (`/api/orders`)

Full order lifecycle from creation through pickup, processing, and delivery.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/orders` | admin, staff, client | Create an order. |
| GET | `/api/orders` | all authenticated | List orders. |
| GET | `/api/orders/:id` | all authenticated | Get an order by ID. |
| PUT | `/api/orders/:id` | admin, staff | Update order details. |
| DELETE | `/api/orders/:id` | admin | Delete an order. |
| PATCH | `/api/orders/:id/status` | admin, staff | Update order status. |
| PATCH | `/api/orders/:id/pickup` | admin, driver | Confirm pickup (with item scan). |
| PATCH | `/api/orders/:id/receive` | admin, staff | Confirm receipt at facility. |
| PATCH | `/api/orders/:id/deliver` | admin, driver | Confirm delivery. |
| PATCH | `/api/orders/:id/reassign` | admin, staff | Reassign order to a different route. |
| PATCH | `/api/orders/:id/reschedule` | admin, staff, client | Reschedule pickup/delivery. |

---

### Invoices (`/api/invoices`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/invoices` | admin, staff | Create an invoice. |
| GET | `/api/invoices` | admin, staff, client | List invoices. |
| GET | `/api/invoices/:id` | admin, staff, client | Get an invoice by ID. |
| POST | `/api/invoices/:id/payments` | admin, staff | Record a payment against an invoice. |
| POST | `/api/invoices/mark-overdue` | admin | Mark eligible invoices as overdue. |

---

### Items (`/api/items`)

The catalog of laundry item types (e.g. shirt, duvet) with associated pricing.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/items` | public | List all items. |
| GET | `/api/items/:id` | public | Get an item by ID. |
| POST | `/api/items` | admin | Create an item. |
| PATCH | `/api/items/:id` | admin | Partially update an item. |
| PUT | `/api/items/:id` | admin | Replace an item. |
| DELETE | `/api/items/:id` | admin | Delete an item. |
| POST | `/api/items/seed` | admin | Seed default item catalog. |

---

### Routes (`/api/routes`)

Delivery/pickup routes that group orders together.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/routes` | admin, staff | Create a route. |
| GET | `/api/routes` | all authenticated | List routes. |
| GET | `/api/routes/:id` | all authenticated | Get a route by ID. |
| PUT | `/api/routes/:id` | admin, staff | Update a route. |
| PATCH | `/api/routes/:id/status` | admin, staff, driver | Update route status. |
| DELETE | `/api/routes/:id` | admin | Delete a route. |

---

### Facility / Machines (`/api/facility`)

Manage the laundry machines at the facility.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/facility/machines` | admin, staff | Get machine status overview. |
| POST | `/api/facility/machines` | admin | Add a machine. |
| PUT | `/api/facility/machines/:id` | admin | Update a machine. |
| DELETE | `/api/facility/machines/:id` | admin | Delete a machine. |
| POST | `/api/facility/machines/:id/assign` | admin, staff | Assign an order to a machine. |
| POST | `/api/facility/machines/:id/release` | admin, staff | Release a machine. |
| POST | `/api/facility/machines/seed` | admin, staff | Seed default machines. |

---

### Invitations (`/api/invitations`)

Token-based invitation flow for onboarding new users via email.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/invitations` | admin | Create and send an invitation email. |
| GET | `/api/invitations` | admin | List all invitations. |
| GET | `/api/invitations/:token/validate` | No | Validate an invitation token (e.g. on page load). |
| POST | `/api/invitations/:token/register` | No | Register a new user via an invitation token. |

---

### Reports (`/api/reports`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/reports/dashboard` | admin, staff | Aggregated dashboard statistics. |
| GET | `/api/reports/revenue` | admin, staff | Monthly revenue breakdown. |
| GET | `/api/reports/orders-by-client` | admin, staff | Order count grouped by client. |
| GET | `/api/reports/sla` | admin, staff | SLA / on-time delivery metrics. |

---

### Health (`/api/health`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Public health check. |
| GET | `/api/health/admin` | admin | Health check requiring authenticated admin. |

---

## Authentication details

### Token types

- **Access token:** Short-lived (default 15 min). Payload: `{ userId, role }`. Read from the `accessToken` cookie by the `authenticate` middleware.
- **Refresh token:** Long-lived (default 7 days). Payload: `{ userId }`. Stored in the DB on the user document and sent in the `refreshToken` cookie. Used only by `/api/auth/refresh` and `/api/auth/logout`.

### Cookie settings

- `httpOnly: true` — not readable by JavaScript.
- `sameSite: "strict"` — CSRF protection.
- `secure: true` in production (`NODE_ENV=production`).
- `maxAge` set to match token expiry.

### Protecting routes

1. **Require login:** Use `authenticate` middleware. Reads `accessToken` from cookies, verifies it, and attaches `req.user = { userId, role }`. Returns `401` if missing or invalid.

2. **Require a role:** Chain `authenticate` then `authorize(...roles)`:

```ts
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

router.get("/admin/dashboard", authenticate, authorize("admin"), handler);
// Multiple roles:
router.get("/data", authenticate, authorize("admin", "staff"), handler);
```

### Status codes

- **401 Unauthorized** — Not logged in, or invalid/expired token.
- **403 Forbidden** — Logged in but insufficient role.

---

## Project structure

```
StayCare-Backend/
├── src/
│   ├── app.ts              # Express app, middleware, route mounting
│   ├── server.ts           # Entry point, DB connect, listen
│   ├── config/
│   │   ├── db.ts           # MongoDB connection
│   │   └── env.ts          # Env var validation (exits on missing required vars)
│   ├── controllers/        # Route handler logic (one file per resource)
│   ├── middleware/
│   │   ├── authenticate.ts # JWT from cookie → req.user
│   │   ├── authorize.ts    # Role check, supports multiple roles
│   │   ├── errorHandler.ts # Centralised error response
│   │   └── validate.ts     # Zod schema validation
│   ├── models/             # Mongoose models (User, Clients, Orders, ...)
│   ├── routes/             # Express routers (one file per resource)
│   ├── utils/
│   │   ├── jwt.ts          # Sign/verify tokens, cookie options
│   │   ├── mail.ts         # Nodemailer helpers (invitation, password reset)
│   │   ├── autoAssignRoute.ts
│   │   ├── paginate.ts
│   │   ├── response.ts
│   │   └── AppError.ts
│   └── validation/         # Zod schemas (one file per resource)
├── http/                   # Sample HTTP requests (REST Client extension)
├── .env.example            # Environment variable template
├── package.json
└── README.md
```

---

## Security summary

- Passwords hashed with bcrypt (bcryptjs); never returned in API responses.
- JWTs only in httpOnly cookies; never in response body or localStorage.
- Refresh tokens stored in DB and cleared on logout; stale tokens are rejected.
- CORS restricted to `CLIENT_URL` with `credentials: true`.
- Access and refresh tokens use different secrets and expiry times.
- Required env vars are validated at startup — the server will not start if they are missing.

---

## Example HTTP requests

See the `http/` folder for sample requests (`login.http`, `refresh.http`, `logout.http`, `createUser.http`, etc.) for use with the [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) VS Code extension.
