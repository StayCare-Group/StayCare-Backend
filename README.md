# StayCare Backend

Backend API for the StayCare management web application. Built with Express, TypeScript, and MongoDB. Uses JWT authentication with httpOnly cookies (access + refresh tokens).

## Tech stack

- **Runtime:** Node.js
- **Framework:** Express 5
- **Language:** TypeScript
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT (jsonwebtoken), bcryptjs, cookie-parser
- **Validation:** Zod

## Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)
- npm or yarn

## Installation

```bash
npm install
```

## Environment variables

Create a `.env` file in the project root:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MongoDB connection string | `mongodb+srv://...` |
| `PORT` | Server port | `3000` |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens | Strong random string |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | Strong random string (different from access) |
| `ACCESS_TOKEN_EXPIRES` | Access token lifetime | `15m` |
| `REFRESH_TOKEN_EXPIRES` | Refresh token lifetime | `7d` |
| `CLIENT_URL` | Allowed CORS origin (frontend URL) | `http://localhost:5173` |

**Security:** In production, use long random secrets and never commit `.env`. Set `NODE_ENV=production` so cookies use `secure: true`.

## Running the server

```bash
npm run dev
```

Starts the server with hot reload (default port from `PORT` or 5000). Connects to MongoDB on startup.

---

## API overview

Base URL: `http://localhost:3000` (or your `PORT`).

All requests that need authentication must send cookies (e.g. `credentials: 'include'` in fetch or `withCredentials: true` in axios). The frontend origin must match `CLIENT_URL`.

### Authentication (`/api/auth`)

Tokens are stored in **httpOnly cookies** only (no tokens in response body or localStorage).

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | No | Login with email/password. Sets `accessToken` and `refreshToken` cookies. |
| POST | `/api/auth/refresh` | No (uses refresh cookie) | Issue new access token. Call when access token is expired to stay logged in. |
| POST | `/api/auth/logout` | No (uses cookies) | Invalidate refresh token and clear cookies. |

#### POST `/api/auth/login`

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Validation:** `email` (valid email), `password` (min 6 characters).

**Success (200):** Response body:

```json
{
  "user": {
    "id": "...",
    "role": "user",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

Cookies `accessToken` (15 min) and `refreshToken` (7 days) are set automatically.

**Errors:** `401` Invalid credentials; `400` Validation or server error.

#### POST `/api/auth/refresh`

No body. Sends `refreshToken` cookie. If valid and still stored for the user, returns a new `accessToken` cookie and the same `user` object as login.

**Success (200):** New access token cookie + `{ user: { id, role, email, name } }`.

**Errors:** `401` Missing or invalid refresh token.

#### POST `/api/auth/logout`

No body. Sends cookies. Removes refresh token from DB and clears both cookies.

**Success (200):** `{ "message": "Logged out" }`.

---

### Users (`/api/users`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/users` | No | Register a new user. |

#### POST `/api/users`

**Request:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123"
}
```

**Validation:** `name` (min 2 chars), `email` (valid email), `password` (min 6 chars).

**Success (201):** Created user (no `password_hash` or `refresh_token` in response).

**Errors:** `400` Validation failed or duplicate email/phone.

---

### Health (`/api/health`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Public health check. |
| GET | `/api/health/admin` | Yes (admin) | Same, but requires authenticated admin. |

Use the admin route to verify that `authenticate` and `authorize("admin")` work.

---

## Authentication details

### Token types

- **Access token:** Short-lived (default 15 min). Payload: `{ userId, role }` where `role` is `"user"` or `"admin"`. Read from cookie `accessToken` by the `authenticate` middleware.
- **Refresh token:** Long-lived (default 7 days). Payload: `{ userId }`. Stored in DB on the user document and sent in cookie `refreshToken`. Used only by `/api/auth/refresh` and `/api/auth/logout`.

### Cookie settings

- `httpOnly: true` — not readable by JavaScript.
- `sameSite: "strict"` — CSRF protection.
- `secure: true` in production (`NODE_ENV=production`).
- `maxAge` set to match token expiry (15 min for access, 7 days for refresh).

### Protecting routes

1. **Require login:** Use `authenticate` middleware. It reads `accessToken` from cookies, verifies it, and sets `req.user` to `{ userId, role }`. Responds with `401` if missing or invalid.

2. **Require role:** Use `authenticate` then `authorize(role)`:

```ts
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

router.get("/admin/dashboard", authenticate, authorize("admin"), handler);
```

- `authorize("admin")`: allows only `role === "admin"`; otherwise `403 Forbidden`.
- `authorize("user")`: allows any authenticated user.

### Status codes

- **401 Unauthorized** — Not logged in, or invalid/expired token.
- **403 Forbidden** — Logged in but not allowed (e.g. non-admin on admin route).

---

## Project structure

```
StayCare-Backend/
├── src/
│   ├── app.ts              # Express app, middleware, route mounting
│   ├── server.ts           # Entry point, dotenv, DB connect, listen
│   ├── config/
│   │   └── db.ts           # MongoDB connection
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── health.controller.ts
│   │   └── user.controller.ts
│   ├── middleware/
│   │   ├── authenticate.ts # JWT from cookie → req.user
│   │   ├── authorize.ts    # req.user.role check (admin/user)
│   │   └── validate.ts     # Zod schema validation
│   ├── models/
│   │   ├── User.ts
│   │   ├── Orders.ts
│   │   ├── Clients.ts
│   │   └── ...
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── health.routes.ts
│   │   └── user.routes.ts
│   ├── utils/
│   │   └── jwt.ts          # Sign/verify tokens, cookie options
│   └── validation/
│       └── user.validation.ts
├── http/                   # Example HTTP requests (e.g. REST Client)
├── .env                    # Not committed; see Environment variables
├── package.json
└── README.md
```

---

## Security summary

- Passwords hashed with bcrypt (via bcryptjs); never returned in API responses.
- JWTs only in httpOnly cookies; never in response body or localStorage.
- Refresh tokens stored in DB and cleared on logout; invalid refresh tokens rejected.
- CORS restricted to `CLIENT_URL` with `credentials: true` for cookie-based auth.
- Access and refresh use different secrets and expiry times.

---

## Example HTTP requests

See the `http/` folder for sample requests (e.g. `login.http`, `refresh.http`, `logout.http`, `createUser.http`) for use with the REST Client extension or similar tools.
