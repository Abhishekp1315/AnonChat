# AnonChat 🎭

> A production-ready, real-time anonymous chat application. Meet strangers, pick your vibe, chat freely — no identity, no traces.

![AnonChat](https://img.shields.io/badge/Java-21-orange?style=flat-square&logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2-green?style=flat-square&logo=springboot)
![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-7-green?style=flat-square&logo=mongodb)
![Redis](https://img.shields.io/badge/Redis-7-red?style=flat-square&logo=redis)
![Docker](https://img.shields.io/badge/Docker-Compose-blue?style=flat-square&logo=docker)
![WebSocket](https://img.shields.io/badge/WebSocket-STOMP-purple?style=flat-square)

---

## Table of Contents

- [Overview](#overview)
- [Live Features](#live-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [WebSocket Protocol](#websocket-protocol)
- [Unique Features](#unique-features)
- [Cloud Deployment](#cloud-deployment)
- [Running Tests](#running-tests)

---

## Overview

AnonChat is a full-stack anonymous chat platform where two strangers are randomly matched and can have a real-time text conversation without ever knowing who the other person is. Sessions are ephemeral, identities are never shared, and the entire stack is containerised and ready to deploy.

---

## Live Features

### Core Chat
- ✅ Real-time messaging via WebSocket (STOMP over SockJS)
- ✅ Random matchmaking queue powered by Redis
- ✅ Message history persisted in MongoDB
- ✅ Read receipts (✓ sent, ✓✓ seen)
- ✅ Typing indicator
- ✅ Enter to send, Shift+Enter for new line
- ✅ Character counter (1000 char limit)
- ✅ Message copy on click
- ✅ Date separators (Today / Yesterday / date)
- ✅ Auto-scroll with scroll-to-bottom button
- ✅ Sound notification toggle 🔔

### Unique Features
- 🎲 **Vibe Matching** — pick Chill / Rant / Bored / Flirty / Deep Talk before matching; same-vibe users are prioritised
- 💣 **Vanishing Messages** — toggle 💣 mode to send messages that self-destruct on both sides after 10 seconds
- 🌡️ **Chat Temperature** — live bar showing conversation intensity (🧊 Cold → 🌋 On Fire) based on messages-per-minute
- 🎯 **Icebreaker Prompts** — 3 random conversation starters appear at the start of every new chat
- 🔤 **Anonymous Nicknames** — each user gets a fun generated name (e.g. MysticPickle80) for the session
- 🎨 **Anonymous Avatars** — deterministic pixel-art style avatar generated from user ID hash
- 😊 **Emoji Reactions** — hover any message to react with 6 emojis; reactions sync live
- ⭐ **Post-Chat Rating** — 1–5 star rating prompt after every session ends
- 🌗 **Dark / Light Theme** — toggle with persistence via localStorage

### UX & Infrastructure
- 🔄 Auto-reconnect WebSocket with reconnect banner
- ⏱️ Session timer in header
- 💤 Idle detection (2-minute warning)
- 🐳 Full Docker Compose setup (one command to run everything)
- 📖 Swagger UI at `/swagger-ui`

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Backend | Java 21 + Spring Boot 3.2 | REST API + WebSocket server |
| Real-time | WebSocket + STOMP + SockJS | Bidirectional messaging |
| Frontend | React 18 | UI |
| Database | MongoDB 7 | Users, sessions, messages |
| Cache / Queue | Redis 7 | Matchmaking queue, active sessions |
| Build | Maven | Backend build |
| Containerisation | Docker + Docker Compose | Full stack orchestration |
| API Docs | SpringDoc OpenAPI (Swagger) | Interactive API docs |
| Testing | JUnit 5 + Mockito | Unit + integration tests |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│                                                             │
│   ┌──────────────┐          ┌──────────────────────────┐   │
│   │  React App   │  REST    │   Spring Boot Backend    │   │
│   │  (port 3000) │◄────────►│      (port 8080)         │   │
│   │              │  WS/STOMP│                          │   │
│   └──────────────┘◄────────►└────────────┬─────────────┘   │
└─────────────────────────────────────────────────────────────┘
                                           │
                           ┌───────────────┴───────────────┐
                           │                               │
                    ┌──────▼──────┐               ┌────────▼───────┐
                    │   MongoDB   │               │     Redis       │
                    │             │               │                 │
                    │ • users     │               │ • match queue   │
                    │ • sessions  │               │ • active rooms  │
                    │ • messages  │               │ • user→room map │
                    └─────────────┘               └────────────────┘
```

### Request Flow

```
User A clicks "Start Chat"
        │
        ▼
POST /api/chat/start  ──►  Redis queue (LPOP)
        │
        ├── No match found ──► Push to queue, return WAITING
        │
        └── Match found ──► Create roomId, store in Redis
                │
                ▼
        Both users subscribe to /topic/chat/{roomId}
                │
                ▼
        User sends message ──► /app/sendMessage
                │
                ▼
        ChatService validates room membership
                │
                ├── Persist to MongoDB (CHAT type)
                │
                └── Broadcast to /topic/chat/{roomId}
                        │
                        ▼
                Both users receive message in real time
```

### Matchmaking Flow

```
User joins queue with vibe=CHILL
        │
        ▼
1. Check vibe-specific queue (chat:queue:vibe:CHILL)
        │
        ├── Match found ──► Create room
        │
        └── No match ──► Check global queue (chat:queue:global)
                │
                ├── Match found ──► Create room
                │
                └── No match ──► Add to both queues, poll every 2s
```

---

## Project Structure

```
anon-chat/
├── backend/
│   ├── src/main/java/com/anonchat/
│   │   ├── AnonChatApplication.java       # Entry point
│   │   ├── config/
│   │   │   ├── WebSocketConfig.java       # STOMP + SockJS config
│   │   │   ├── RedisConfig.java           # Lettuce client (Upstash compatible)
│   │   │   ├── CorsConfig.java            # CORS for frontend
│   │   │   └── MongoConfig.java           # Auditing
│   │   ├── controller/
│   │   │   ├── UserController.java        # POST /api/users/register|login
│   │   │   └── ChatController.java        # POST /api/chat/start|next|end|rate
│   │   ├── websocket/
│   │   │   └── ChatWebSocketController.java  # /app/sendMessage|typing|react|readReceipt
│   │   ├── service/
│   │   │   ├── UserService.java           # Registration + login logic
│   │   │   ├── MatchmakingService.java    # Redis queue + vibe matching
│   │   │   ├── ChatService.java           # Message routing + persistence
│   │   │   └── IdleCleanupService.java    # Scheduled queue monitoring
│   │   ├── model/
│   │   │   ├── User.java                  # MongoDB document
│   │   │   ├── ChatSession.java           # Room + ratings
│   │   │   └── ChatMessage.java           # Message + reactions
│   │   ├── repository/                    # Spring Data MongoDB repos
│   │   ├── dto/                           # Request/response DTOs
│   │   └── exception/                    # GlobalExceptionHandler
│   ├── src/test/                          # JUnit + Mockito tests
│   ├── Dockerfile                         # Multi-stage Java 21 build
│   └── pom.xml
│
├── frontend/
│   ├── src/
│   │   ├── App.js                         # Root — home|auth|chat routing
│   │   ├── context/
│   │   │   └── ThemeContext.js            # Dark/light theme provider
│   │   ├── pages/
│   │   │   ├── HomePage.js                # Landing page with animations
│   │   │   ├── AuthPage.js                # Login + Register tabs
│   │   │   └── ChatPage.js                # Main chat UI
│   │   ├── components/
│   │   │   ├── MessageBubble.js           # Chat bubble + reactions + vanish
│   │   │   ├── EmojiPicker.js             # Lightweight emoji picker
│   │   │   ├── IcebreakerPrompts.js       # Conversation starters
│   │   │   ├── ChatTemperature.js         # Live vibe meter
│   │   │   ├── VibeSelector.js            # Mood picker
│   │   │   ├── AnonAvatar.js              # Generated avatar
│   │   │   └── PostChatRating.js          # Star rating
│   │   ├── websocket/
│   │   │   └── useChat.js                 # STOMP hook (messages, reactions, vanish)
│   │   ├── services/
│   │   │   └── api.js                     # Axios REST calls
│   │   └── utils/
│   │       └── nickname.js                # Deterministic nickname generator
│   ├── Dockerfile                         # Multi-stage React + nginx build
│   └── nginx.conf                         # SPA routing + WS proxy
│
├── docker-compose.yml                     # Full stack orchestration
├── .env.example                           # Environment variable template
└── postman_collection.json                # Ready-to-import API collection
```

---

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose

That's it. No Java, Node, or database installs needed.

### Run with Docker (recommended)

```bash
# 1. Clone the repo
git clone https://github.com/your-username/anon-chat.git
cd anon-chat

# 2. Start everything
docker-compose up --build
```

| Service  | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger-ui |
| API Docs (JSON) | http://localhost:8080/api-docs |

### Run Locally (without Docker)

**Requirements:** Java 21, Maven, Node 18+, MongoDB on port 27017, Redis on port 6379

```bash
# Terminal 1 — Backend
cd backend
mvn spring-boot:run

# Terminal 2 — Frontend
cd frontend
npm install
npm start
```

---

## Environment Variables

Copy `.env.example` to `.env` and adjust as needed.

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb://localhost:27017/anonchat` | MongoDB connection string |
| `MONGODB_DATABASE` | `anonchat` | Database name |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_PASSWORD` | _(empty)_ | Redis password |
| `REDIS_SSL` | `false` | Enable TLS (set `true` for Upstash) |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Allowed frontend origin |

### MongoDB Atlas

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/anonchat
```

### Upstash Redis

```env
REDIS_HOST=<your-host>.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=<your-password>
REDIS_SSL=true
```

---

## API Reference

### Users

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/users/register` | Register a new user |
| `POST` | `/api/users/login` | Login with email + phone |

**Register request:**
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "phoneNumber": "+1234567890",
  "country": "US",
  "gender": "FEMALE"
}
```

**Login request:**
```json
{
  "email": "alice@example.com",
  "phoneNumber": "+1234567890"
}
```

### Chat

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat/start` | Join matchmaking queue |
| `POST` | `/api/chat/next` | Skip to next user |
| `POST` | `/api/chat/end` | End current session |
| `POST` | `/api/chat/rate` | Submit post-chat rating |
| `GET` | `/api/chat/status/{userId}` | Get current room ID |
| `GET` | `/api/chat/history/{roomId}` | Get message history |
| `GET` | `/api/chat/queue/size` | Users waiting in queue |
| `GET` | `/api/chat/vibe/{roomId}` | Get matched vibe for room |

**Start chat request:**
```json
{
  "userId": "<id>",
  "vibe": "CHILL"
}
```

**Response (matched):**
```json
{
  "success": true,
  "data": {
    "roomId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "MATCHED",
    "message": "Matched on vibe: CHILL — say hi!"
  }
}
```

**Response (waiting):**
```json
{
  "success": true,
  "data": {
    "status": "WAITING",
    "message": "Waiting for a match..."
  }
}
```

---

## WebSocket Protocol

**Endpoint:** `http://localhost:8080/ws` (SockJS)

**Subscribe to room:**
```
/topic/chat/{roomId}
```

### Outbound destinations (client → server)

| Destination | Purpose |
|---|---|
| `/app/sendMessage` | Send a chat message |
| `/app/typing` | Send typing indicator |
| `/app/readReceipt` | Mark messages as seen |
| `/app/react` | Add/toggle emoji reaction |

### Message payload

```json
{
  "id": "uuid",
  "senderId": "user-id",
  "roomId": "room-id",
  "message": "Hello!",
  "timestamp": "2024-01-01T12:00:00Z",
  "type": "CHAT"
}
```

### Message types

| Type | Description |
|---|---|
| `CHAT` | Regular text message |
| `VANISH` | Self-destructs after 10 seconds on both sides |
| `TYPING` | Typing indicator (not persisted) |
| `READ_RECEIPT` | Partner has seen messages |
| `REACTION` | Emoji reaction on a message |
| `SYSTEM` | Server-generated notification |

### Reaction payload

```json
{
  "senderId": "user-id",
  "roomId": "room-id",
  "targetMessageId": "message-uuid",
  "reaction": "❤️",
  "type": "REACTION"
}
```

---

## Unique Features

### Vibe Matching
Users select a mood before entering the queue. The matchmaking service first checks a vibe-specific Redis queue, then falls back to the global queue. This means two people who both want a "Deep Talk" will find each other faster.

Available vibes: `CHILL` 😌 · `RANT` 😤 · `BORED` 🥱 · `FLIRTY` 😏 · `DEEP` 🧠

### Vanishing Messages
Clicking the 💣 button enables vanish mode. Messages sent in this mode are broadcast with `type: VANISH`. Both the sender and receiver set a `vanishAt = now + 10s` timestamp locally. A 500ms cleanup interval removes expired messages from the UI on both sides simultaneously.

### Chat Temperature
A rolling 60-second window tracks how many CHAT messages have been sent. A `setInterval` recalculates every second, so the bar naturally decays when the conversation slows down.

```
0 msg/min  → 🧊 Cold
2 msg/min  → 😐 Lukewarm
5 msg/min  → 🙂 Warm
8 msg/min  → 🔥 Hot
10+ msg/min → 🌋 On Fire
```

### Anonymous Avatars & Nicknames
Both are generated deterministically from a hash of the user's ID — so the same user always gets the same avatar and nickname, but it's never linked to their real identity.

---

## Cloud Deployment

### Docker Compose (any VPS)

```bash
# On your server
git clone https://github.com/your-username/anon-chat.git
cd anon-chat
cp .env.example .env
# Edit .env with your Atlas + Upstash credentials
docker-compose up -d --build
```

### Recommended free-tier services

| Service | Provider |
|---|---|
| MongoDB | [MongoDB Atlas](https://www.mongodb.com/atlas) — free M0 cluster |
| Redis | [Upstash](https://upstash.com) — free tier, TLS included |
| Hosting | [Railway](https://railway.app), [Render](https://render.com), or any VPS |

---

## Running Tests

```bash
cd backend
mvn test
```

Tests cover:
- `UserServiceTest` — registration, duplicate email detection
- `MatchmakingServiceTest` — queue join, match creation, session end
- `UserControllerIntegrationTest` — REST endpoint validation

---

## Postman Collection

Import `postman_collection.json` from the project root into Postman for ready-to-use API requests with all endpoints pre-configured.

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push and open a Pull Request

---

## License

MIT — do whatever you want with it.

---

<p align="center">Built with ☕ Java, ⚛️ React, and a healthy disregard for small talk.</p>
