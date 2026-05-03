# Vitalis AI — Healthcare AI Agent Platform

> An end-to-end AI-powered healthcare assistant. Describe your symptoms, get instant AI triage, find nearby hospitals, and manage your health sessions — all with multi-device encrypted sync.

---

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Landing Page Setup](#landing-page-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Features](#features)
- [Architecture](#architecture)
- [Contributing](#contributing)

---

## Overview

Vitalis AI is a full-stack healthcare platform built for hackathon Team Zyphers. It combines:

- **AI-powered symptom triage** via Azure OpenAI / GPT-4 with structured JSON output
- **Nearby facility search** (hospitals, clinics, pharmacies) via Google Maps or OpenStreetMap
- **Multi-device encrypted sync** using WebRTC signaling + Azure Blob relay
- **Session management** with full consultation history
- **Multi-language support** across 6 Indian languages

---

## Project Structure

```
VitalisAI/
├── Backend/                  # Node.js REST API + WebSocket signaling server
│   ├── src/
│   │   ├── controllers/      # Route handler logic
│   │   ├── services/         # Business logic (AI, auth, facility, sync)
│   │   ├── models/           # Mongoose schemas
│   │   ├── repositories/     # Database access layer
│   │   ├── routes/           # Express route definitions
│   │   ├── middleware/       # Auth, validation, rate limiting, error handling
│   │   ├── config/           # Env config, DI container, logger
│   │   ├── db/               # MongoDB connection + index setup
│   │   ├── signaling/        # WebSocket signaling server (WebRTC)
│   │   ├── utils/            # ApiError, ApiResponse, asyncHandler, etc.
│   │   └── validators/       # Joi validation schemas
│   └── package.json
│
├── Frontend-2/               # Main patient-facing React SPA
│   ├── src/
│   │   ├── App.jsx           # Main app with auth + page routing
│   │   ├── HospitalMap.jsx   # Leaflet map component
│   │   └── api.js            # Axios client wired to backend
│   └── package.json
│
└── Vitalis_Ai_HomePage/      # Marketing landing page
    ├── src/
    │   ├── components/       # Navbar, Hero, About, WhyUs, Testimonials, CTA, Footer
    │   └── pages/
    │       └── HomePage.jsx
    └── package.json
```

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 20 (ES Modules) |
| Framework | Express 5 |
| Database | MongoDB (Mongoose 9) |
| Auth | JWT (access + refresh tokens), bcryptjs |
| Validation | Joi |
| Security | Helmet, CORS, express-rate-limit |
| AI | Azure AI Foundry (Azure OpenAI) |
| Blob Storage | Azure Blob Storage (SAS-based sync relay) |
| Maps | Google Places API / OpenStreetMap Overpass |
| WebSockets | `ws` (WebRTC P2P signaling) |
| Logging | Winston + Morgan |

### Frontend-2 (Patient App)
| Layer | Technology |
|---|---|
| UI | React 18, Vite 5 |
| Styling | Tailwind CSS 3 |
| Maps | Leaflet + react-leaflet |
| 3D | React Three Fiber, Three.js |
| Animations | Framer Motion |
| Icons | Lucide React |

### Landing Page
| Layer | Technology |
|---|---|
| UI | React 18, Vite 5 |
| Routing | React Router DOM 6 |
| Animations | GSAP 3 (ScrollTrigger) + Lenis smooth scroll |

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- MongoDB Atlas account (or local MongoDB)
- (Optional) Azure OpenAI deployment for live AI triage
- (Optional) Google Maps API key for facility search

---

### Backend Setup

```bash
cd Backend
npm install
```

Create a `.env` file in the `Backend/` directory (see [Environment Variables](#environment-variables) below).

```bash
# Start development server (HTTP API on port 3000)
npm run dev

# Start production server
npm start
```

The signaling server (WebSocket, port 3001) starts automatically alongside the main server.

---

### Frontend Setup

```bash
cd Frontend-2
npm install
npm run dev       # Development server
npm run build     # Production build
```

Ensure the backend is running and update the API base URL in `src/api.js` if needed.

---

### Landing Page Setup

```bash
cd Vitalis_Ai_HomePage
npm install
npm run dev       # Development server
npm run build     # Production build
```

---

## Environment Variables

Create `Backend/.env` with the following variables. Only `MONGODB_URI` and `JWT_ACCESS_SECRET` are required for local development (set `AI_PROVIDER=mock` to skip Azure).

```env
# ── Server ─────────────────────────────────────────────
NODE_ENV=development
PORT=3000
SIGNALING_PORT=3001
LOG_LEVEL=info
CORS_ORIGINS=                   # Comma-separated origins; empty = allow all

# ── MongoDB (REQUIRED) ────────────────────────────────
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/vitalis?retryWrites=true&w=majority

# ── JWT (REQUIRED, min 32 chars) ──────────────────────
JWT_ACCESS_SECRET=<64-char-base64-secret>
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL_DAYS=30
JWT_ISSUER=vitalis-ai
JWT_AUDIENCE=vitalis-clients

# ── AI Provider ───────────────────────────────────────
AI_PROVIDER=mock                # azure-foundry | mock
AI_ENDPOINT=https://vitalis-foundry.openai.azure.com
AI_KEY=<Azure AI Foundry API key>
AI_DEPLOYMENT=gpt-4.1-mini
AI_API_VERSION=2024-10-21
AI_TIMEOUT_MS=20000

# ── Maps Provider ─────────────────────────────────────
MAPS_PROVIDER=osm               # google | osm | mock
MAPS_API_KEY=                   # Required if MAPS_PROVIDER=google

# ── Azure Blob Sync Relay ─────────────────────────────
RELAY_PROVIDER=mock             # azure-blob | mock
AZURE_STORAGE_ACCOUNT=vitalisrelay
AZURE_STORAGE_KEY=<storage access key>
AZURE_STORAGE_CONTAINER=sync-relay
RELAY_TTL_HOURS=24

# ── Rate Limiting ─────────────────────────────────────
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120
AI_RATE_LIMIT_MAX=30
```

---

## API Reference

All routes are prefixed `/api/v1`. All protected routes require `Authorization: Bearer <access_token>`.

### Auth — `/api/v1/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Register with name, email, password |
| POST | `/login` | — | Returns access token + refresh token |
| POST | `/refresh` | — | Rotate refresh token |
| POST | `/logout` | — | Revoke refresh token family |
| GET | `/me` | ✓ | Get current user profile |
| PUT | `/profile` | ✓ | Update user profile |

### Devices — `/api/v1/devices`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | ✓ | Register device with public key |
| GET | `/` | ✓ | List user's devices |
| DELETE | `/:id` | ✓ | Revoke a device |

### Health Sessions — `/api/v1/sessions`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | ✓ | Create / upsert session |
| GET | `/` | ✓ | List sessions (cursor-paginated) |
| GET | `/:id` | ✓ | Get session by ID |
| GET | `/:id/messages` | ✓ | Get session messages |
| PATCH | `/:id` | ✓ | Patch session (optimistic concurrency) |
| DELETE | `/:id` | ✓ | Delete session |

### AI Triage — `/api/v1/ai`

| Method | Endpoint | Auth | Rate Limit | Description |
|---|---|---|---|---|
| POST | `/triage` | ✓ | 30/min | GPT triage with structured JSON output |
| POST | `/triage/stream` | ✓ | 30/min | Streaming triage response |

### Facility Search — `/api/v1/facility`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/nearby` | ✓ | Nearby hospitals/clinics/pharmacies (cached 10 min) |

### Sync — `/api/v1/sync`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/announce` | ✓ | List active peer devices |
| POST | `/relay/upload-url` | ✓ | Issue SAS PUT URL for blob upload |
| POST | `/relay/download-url` | ✓ | Issue SAS GET URL for blob download |
| POST | `/relay/ack` | ✓ | Mark sync envelope as delivered |

### Health Probes (no auth)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health/live` | Liveness probe |
| GET | `/health/ready` | Readiness probe (503 if MongoDB down) |

### WebSocket Signaling

```
WS ws://localhost:3001/ws?token=<JWT>
```

WebRTC SDP/ICE relay for P2P encrypted cross-device sync.

---

## Features

### Patient Web App (Frontend-2)
- **Authentication** — Register, login, refresh token rotation, logout
- **AI Symptom Triage** — Describe symptoms → AI returns severity (low/medium/high), diagnosis hints, and care advice
- **Multi-language** — Supports English, Hindi, Bengali, Tamil, Telugu, Marathi
- **Consultation History** — Full paginated session history with severity badges
- **Hospital Map** — Interactive Leaflet map with nearby hospitals, clinics, and pharmacies
- **3D UI** — Three.js visual components with mouse-tracking parallax

### Backend
- **Refresh token rotation** with reuse detection (revokes entire family on reuse)
- **Optimistic concurrency** on session updates via `expectedVersion`
- **Provider abstraction** — swap AI (Azure / mock), Maps (Google / OSM / mock), and Sync Relay (Azure Blob / mock) via env vars
- **Structured AI output** — GPT responses enforced with JSON schema for consistent parsing
- **End-to-end encrypted sync** — Devices exchange encrypted blobs via SAS URLs; server never sees plaintext

---

## Architecture

```
┌─────────────────────────────────┐
│       Vitalis AI Platform       │
├─────────────┬───────────────────┤
│  Frontend   │   Landing Page    │
│  (React +   │   (React + GSAP + │
│  Tailwind)  │   Lenis)          │
└──────┬──────┴───────────────────┘
       │ HTTPS REST /api/v1
┌──────▼──────────────────────────┐
│         Express 5 API           │
│  Auth │ AI │ Session │ Facility │
│  Device │ Sync                  │
├─────────────────────────────────┤
│  MongoDB (Mongoose)             │
└─────────────────────────────────┘
       │ WebSocket (port 3001)
┌──────▼──────────────────────────┐
│     WebRTC Signaling Server     │
│    (P2P Encrypted Sync Relay)   │
└─────────────────────────────────┘
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

**Team Zyphers** — Built with ❤️ for healthcare accessibility.
