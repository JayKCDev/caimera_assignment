# MathSprint

A real-time competitive math quiz where multiple users answer the same question simultaneously. First correct answer wins, the question changes immediately, and scores are tracked on a live leaderboard.

---

## Tech Stack

| Layer        | Technologies                                                      |
| ------------ | ----------------------------------------------------------------- |
| **Backend**  | Node.js, Express, Socket.io, TypeScript                           |
| **Database** | Redis (ioredis) – single instance                                 |
| **Frontend** | React 18, Vite, Socket.io-client, TypeScript                      |
| **Styling**  | Tailwind CSS, shadcn/ui (CVA, clsx, tailwind-merge), Lucide icons |
| **Other**    | react-hot-toast                                                   |

---

## Project Structure

```
caimera_assignment/
├── backend/
│   ├── server.ts                 # Express + Socket.io setup, REST routes
│   ├── services/
│   │   ├── redis.service.ts      # Redis client singleton
│   │   ├── session.service.ts    # Session & username management
│   │   ├── question.service.ts   # Question generation & current question
│   │   ├── submission.service.ts # Answer validation & winner detection
│   │   └── leaderboard.service.ts# Leaderboard (Redis Sorted Set)
│   ├── socket/
│   │   └── handlers.ts           # Socket.io event handlers
│   ├── utils/
│   │   ├── question-generator.ts # Arithmetic question generator
│   │   └── validators.ts         # Input validation
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx               # Main app & routing
│   │   ├── components/           # UI components (QuestionDisplay, Leaderboard, etc.)
│   │   ├── context/GameContext.tsx
│   │   ├── hooks/useSession.ts, useSocket.ts, useNetworkStatus.ts
│   │   ├── lib/api.ts, socketInstance.ts, utils.ts
│   │   └── config/socket.ts      # Socket.io client config
│   ├── vite.config.ts
│   └── package.json
└── README.md
```

---

## Architecture Overview

- **Backend**: Express REST API + Socket.io for real-time events
- **Data store**: Redis only (sessions, leaderboard, current question, winner detection)
- **Auth**: Session-based; no JWT/OAuth. Server generates `sessionId` via `crypto.randomUUID()`
- **Winner detection**: Atomic Redis `SET NX` to ensure first correct answer wins
- **Question flow**: New question generated when someone wins; broadcast to all connected clients

### Redis Keys

| Key                                  | Type       | Purpose                                           |
| ------------------------------------ | ---------- | ------------------------------------------------- |
| `session:{sessionId}`                | Hash       | User session (username, score, createdAt)         |
| `username:index`                     | Set        | Active usernames for uniqueness                   |
| `leaderboard`                        | Sorted Set | Scores by sessionId                               |
| `current:question`                   | Hash       | Active question (id, problem, answer, difficulty) |
| `question:{id}:winner`               | String     | Winner sessionId (TTL 5 min)                      |
| `question:{id}:attempts:{sessionId}` | String     | Prevents duplicate submissions                    |

### REST API

| Method | Path                      | Description                           |
| ------ | ------------------------- | ------------------------------------- |
| POST   | `/api/session`            | Create session (body: `{ username }`) |
| GET    | `/api/session/:sessionId` | Get session                           |
| DELETE | `/api/session/:sessionId` | Delete session                        |
| GET    | `/api/question/current`   | Get current question (no answer)      |
| GET    | `/api/leaderboard`        | Get top 10                            |
| GET    | `/api/health`             | Health check (Redis status)           |

### Socket Events

| Client → Server   | Server → Client                                                         |
| ----------------- | ----------------------------------------------------------------------- |
| `join`            | `question:current`, `question:new`, `leaderboard:update`, `users:count` |
| `submit_answer`   | `answer:result` (per submitter)                                         |
| `get_leaderboard` | `leaderboard:update`                                                    |
| `ping`            | `pong`                                                                  |
| —                 | `winner:announced`                                                      |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable      | Required | Default       | Description                                          |
| ------------- | -------- | ------------- | ---------------------------------------------------- |
| `PORT`        | No       | `3000`        | HTTP server port                                     |
| `REDIS_URL`   | Yes      | —             | Redis connection URL (e.g. `redis://localhost:6379`) |
| `NODE_ENV`    | No       | `development` | Environment                                          |
| `CORS_ORIGIN` | No       | `*`           | Allowed CORS origin for Socket.io                    |

### Frontend

| Variable          | Required | Default                 | Description          |
| ----------------- | -------- | ----------------------- | -------------------- |
| `VITE_SOCKET_URL` | No       | `http://localhost:3000` | Socket.io server URL |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Redis running locally or remote URL

### Backend

```bash
cd backend
npm install
cp .env.example .env   # Edit .env with your REDIS_URL
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` and proxies `/api` and `/socket.io` to the backend.

### Production Build

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build
```

---

## Architecture Decisions Made

- **Redis-only** for speed; PostgreSQL documented as future enhancement for audit logs/analytics
- **Atomic operations** for concurrency (`SET NX`, `SADD`) to prevent race conditions
- **Server-side timestamps** for fairness; network latency is accepted (RTT compensation for production)
- **No authentication** – session-based; JWT as production upgrade

---

## Known Limitations

- **Network latency** affects fairness; RTT-based compensation for production
- **Username namespace** not partitioned – all users share a global namespace
- **No answer history** – past answers and attempts are not stored
- **Single Redis instance** – Redis Cluster for high availability
- When sessions expire via TTL, usernames remain in `username:index`, so those users cannot reuse the same username until index is cleaned

---

## Production Enhancements

- Add PostgreSQL for audit logs and analytics
- Implement RTT-based latency compensation
- Add Redis Cluster for high availability
- Implement user authentication (JWT/OAuth)
- Add rate limiting per IP
- Add question difficulty progression
- Add answer streak bonuses

---
