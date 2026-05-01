<div align="center">

# BaatCheet

### Real-time chat webapp with an AI chatbot built directly into the conversation

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io/)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-AI_Proxy-7C3AED?style=flat-square)](https://openrouter.ai/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media-3448C5?style=flat-square&logo=cloudinary&logoColor=white)](https://cloudinary.com/)

</div>

> Replace this with your best hero GIF or product screenshot.
>
> `![BaatCheet Hero](./screenshots/your-hero.gif)`

BaatCheet is a full-stack real-time chat app that combines live messaging, media sharing, and a built-in Meta AI-style assistant in one experience. The assistant is not tucked away behind a separate page. It lives inside the chat, streams replies live, and can even answer privately inside shared conversations.

This is the kind of project that shows both product thinking and engineering depth: real-time systems, AI integration, selective message visibility, media handling, and polished frontend UX.

## Why It Stands Out

- In-chat AI assistant: Trigger the assistant with `@AI`, `@AI Assistant`, or `/ai` in group chats, while 1-on-1 AI chats reply automatically.
- Real-time streaming: AI responses stream chunk-by-chunk over Socket.IO, so replies appear progressively instead of waiting for a full payload.
- Private AI queries: Users can toggle a private view in direct or group chats and ask AI questions without other people seeing the prompt or the answer.
- Image sharing and live messaging: Messages and attachments move instantly through the chat flow, with uploads handled through Cloudinary.
- Extra product polish: Reactions, editing, deletion, search, summaries, smart replies, theming, and WebRTC video calling are already built in.

## Tech Stack

**Frontend**

- React 18
- Vite
- Tailwind CSS
- Axios
- React Router
- React Markdown
- Socket.IO Client

**Backend**

- Node.js
- Express
- TypeScript
- MongoDB
- Mongoose
- Socket.IO
- JWT authentication
- Multer

**AI and media**

- OpenRouter for streamed in-chat AI responses
- Google Gemini API for chat summaries
- Cloudinary for file storage and delivery

**Tooling**

- Docker
- ESLint
- Vercel Analytics

## Technical Highlights

- WebSocket AI streaming: The backend reads streamed OpenRouter chunks, emits `messageChunk` events in real time, and finalizes the full AI message only after the stream completes.
- Private View enforcement: AI-only messages are stored with a `visibleOnlyTo` field, filtered in the client, and emitted only to the requesting user to preserve privacy inside shared chats.
- Region-safe AI routing: Instead of depending on direct provider access for live chat, the app uses OpenRouter as a practical proxy layer to avoid geographic API blocking.
- Clean architecture: Chat state lives in React context, reusable behavior is split into hooks, and backend data access is organized into repositories for maintainability.

## Architecture At A Glance

```text
React + Tailwind UI
        |
        |  HTTP + Socket.IO
        v
Express + TypeScript API
        |
        |-- MongoDB / Mongoose
        |     Users, chats, messages, visibility rules
        |
        |-- OpenRouter
        |     Streamed AI chat responses
        |
        |-- Gemini API
        |     Conversation summaries
        |
        |-- Cloudinary
              Image and file uploads
```

## Feature Deep Dive

### 1. In-Chat AI Assistant

The assistant is modeled as part of the chat ecosystem rather than a separate tool. In group chats, it only responds when explicitly invoked. In direct AI chats, it behaves like a normal conversation partner.

### 2. Private AI Queries

Private AI mode is one of the strongest engineering ideas in this project. A user can ask the assistant a question inside an existing chat, but the query and the AI response stay hidden from everyone else. That required database-level visibility flags, socket routing rules, and selective frontend rendering.

### 3. Real-Time Response Streaming

Instead of waiting for the full assistant output, the app streams partial chunks to the UI for a more natural typing effect. That creates a noticeably better AI UX and makes the product feel faster.

## API Surface

**Auth**

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `PATCH /auth/profile`

**Chats**

- `GET /api/chat`
- `GET /api/chat/users`
- `POST /api/chat/c/:receiverId`
- `POST /api/chat/group`
- `GET /api/chat/group/:chatId`
- `PUT /api/chat/group/:chatId`
- `DELETE /api/chat/:chatId`
- `POST /api/chat/:chatId/summarize`

**Messages**

- `GET /api/messages/:chatId`
- `POST /api/messages/:chatId`
- `GET /api/messages/:chatId/search`
- `PATCH /api/messages/:messageId`
- `DELETE /api/messages/:messageId`
- `POST /api/messages/:messageId/reaction`

## Run It Locally

### Prerequisites

- Node.js 18+
- MongoDB local instance or MongoDB Atlas
- Cloudinary account
- OpenRouter API key
- Gemini API key

### 1. Install dependencies

```bash
git clone <your-repo-url>
cd BaatCheet

cd backend
npm install

cd ../client
npm install
```

### 2. Create `backend/.env`

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
SERVER_URL=http://localhost:5000

MONGO_URI=mongodb://localhost:27017
DB_NAME=BaatCheet
DB_MIN_POOL_SIZE=2
DB_MAX_POOL_SIZE=5

COOKIE_VALIDITY_SEC=172800
ACCESS_TOKEN_VALIDITY_SEC=182800
REFRESH_TOKEN_VALIDITY_SEC=604800
TOKEN_ISSUER=api.your-app.local
TOKEN_AUDIENCE=your-app.local
JWT_SECRET_KEY=replace_with_a_long_random_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_FOLDER=baatcheet
CLOUDINARY_STARTUP_CHECK=true
CLOUDINARY_MAX_IMAGE_SIZE_MB=10
CLOUDINARY_MAX_VIDEO_SIZE_MB=50
CLOUDINARY_MAX_RAW_SIZE_MB=20

OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=google/gemini-2.5-flash

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
SUMMARY_MAX_MESSAGES=50
```

### 3. Create `client/.env`

```env
VITE_API_URL=http://localhost:5000
VITE_SERVER_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_SIGNALING_URL=http://localhost:5000
```

`VITE_SERVER_URL` is especially important in the current client implementation because the socket and WebRTC layers read that value for real-time connections.

### 4. Start both apps

Backend:

```bash
cd backend
npm run dev
```

Client:

```bash
cd client
npm run dev
```

Open `http://localhost:5173`.

### Optional: Docker

```bash
docker compose up --build
```

That starts:

- Backend on `http://localhost:5000`
- Frontend on `http://localhost:3002`
- MongoDB in Docker as `mongod`

## Environment Variables

### Backend

- `NODE_ENV`: Runtime mode.
- `PORT`: Express server port.
- `FRONTEND_URL`: Allowed frontend origin for CORS. Supports comma-separated values.
- `SERVER_URL`: Public backend URL.
- `MONGO_URI` or `DB_URL`: MongoDB connection string.
- `DB_NAME`: Database name.
- `DB_MIN_POOL_SIZE`: Minimum Mongo connection pool size.
- `DB_MAX_POOL_SIZE`: Maximum Mongo connection pool size.
- `COOKIE_VALIDITY_SEC`: Cookie lifetime.
- `ACCESS_TOKEN_VALIDITY_SEC`: Access token lifetime.
- `REFRESH_TOKEN_VALIDITY_SEC`: Refresh token lifetime.
- `TOKEN_ISSUER`: JWT issuer.
- `TOKEN_AUDIENCE`: JWT audience.
- `JWT_SECRET_KEY`: JWT signing secret.
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name.
- `CLOUDINARY_API_KEY`: Cloudinary API key.
- `CLOUDINARY_API_SECRET`: Cloudinary API secret.
- `CLOUDINARY_FOLDER`: Upload folder.
- `CLOUDINARY_STARTUP_CHECK`: Enables Cloudinary validation on boot.
- `CLOUDINARY_MAX_IMAGE_SIZE_MB`: Max image upload size.
- `CLOUDINARY_MAX_VIDEO_SIZE_MB`: Max video upload size.
- `CLOUDINARY_MAX_RAW_SIZE_MB`: Max raw file upload size.
- `OPENROUTER_API_KEY`: Key for streamed AI chat responses.
- `OPENROUTER_MODEL`: OpenRouter model name.
- `GEMINI_API_KEY`: Key for chat summaries.
- `GEMINI_MODEL`: Gemini model name.
- `GEMINI_BASE_URL`: Gemini API base URL.
- `SUMMARY_MAX_MESSAGES`: Number of recent messages used for summaries.

### Client

- `VITE_API_URL`: Base URL for HTTP API requests.
- `VITE_SERVER_URL`: Base URL used by Socket.IO and WebRTC connection logic.
- `VITE_SOCKET_URL`: Available as an override in env samples.
- `VITE_SIGNALING_URL`: Available as an override in env samples.

## Project Structure

```text
BaatCheet/
|-- backend/
|   |-- src/
|   |-- package.json
|   `-- .env.sample
|-- client/
|   |-- src/
|   |-- package.json
|   `-- .env.sample
|-- screenshots/
|-- docker-compose.yml
`-- README.md
```

## Screenshots

> Add 2-4 polished screenshots here once you export them.
>
> Example:
>
> `![Chat screen](./screenshots/chat-main.png)`
>
> `![Private AI mode](./screenshots/private-ai.png)`

## Let's Connect

- LinkedIn: https://www.linkedin.com/in/saqib-mahmood-b604651a9/  (#)

---

This project demonstrates real-time architecture, AI product integration, privacy-aware messaging logic, and strong full-stack execution in one build.
