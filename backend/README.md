# BaatCheet Backend

Express + TypeScript API powering authentication, chats, messages, media uploads, AI responses, summaries, and real-time events for BaatCheet.

## What This Service Handles

- User auth with JWT-based access control
- 1-on-1 and group chat management
- Message CRUD, reactions, and search
- Socket.IO real-time messaging and AI stream events
- WebRTC signaling for video calls
- Cloudinary uploads for images and files
- OpenRouter-powered in-chat AI replies

## Core Endpoints

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

**Health**

- `GET /health`
- `GET /health/cloudinary`

## Technical Highlights

- Streams AI output chunk-by-chunk through Socket.IO before persisting the final assistant response.
- Supports private AI replies using message-level visibility with `visibleOnlyTo`.
- Uses repository-style data access around Mongoose models for cleaner controllers.
- Validates Cloudinary connectivity on startup when enabled.
- Supports both REST and Socket.IO on the same server instance.

## Requirements

- Node.js 18+
- MongoDB local, Atlas, or Docker
- Cloudinary account
- OpenRouter API key

## Run Locally

### 1. Install

```bash
npm install
```

### 2. Create `.env`

Copy from the sample if you want:

```bash
copy .env.sample .env
```

Recommended local config:

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
OPENROUTER_MODEL=openai/gpt-4o-mini
SUMMARY_MAX_MESSAGES=50
```

### 3. Start development server

```bash
npm run dev
```

Backend runs on `http://localhost:5000` by default.

## Docker

From the repo root:

```bash
docker compose up --build
```

For Docker, the common backend adjustments are:

- `FRONTEND_URL=http://localhost:3002`
- `MONGO_URI=mongodb://mongod:27017`

## Environment Variables

- `NODE_ENV`: Runtime mode.
- `PORT`: Express server port.
- `FRONTEND_URL`: Allowed CORS origins. Supports comma-separated values.
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
- `CLOUDINARY_STARTUP_CHECK`: Enables Cloudinary startup validation.
- `CLOUDINARY_MAX_IMAGE_SIZE_MB`: Max image upload size.
- `CLOUDINARY_MAX_VIDEO_SIZE_MB`: Max video upload size.
- `CLOUDINARY_MAX_RAW_SIZE_MB`: Max generic file upload size.
- `OPENROUTER_API_KEY`: Required for streamed AI chat responses and summaries.
- `OPENROUTER_MODEL`: OpenRouter model name.
- `SUMMARY_MAX_MESSAGES`: Number of recent messages sent into summary context.

## Scripts

```bash
npm run dev
npm run build
npm start
npm run start:full
```

## Project Shape

```text
src/
|-- controllers/   # Request handlers
|-- routes/        # Express routes
|-- middlewares/   # Auth, uploads, request guards
|-- validators/    # express-validator rules
|-- database/      # Models, repositories, db bootstrap
|-- helpers/       # AI, Cloudinary, async helpers, utilities
|-- socket/        # Socket.IO setup and event handling
|-- core/          # API error/response/JWT helpers
|-- config.ts
|-- app.ts
`-- server.ts
```

## Common Issues

- CORS errors usually mean `FRONTEND_URL` does not match the real frontend origin.
- Docker Mongo issues usually mean `MONGO_URI` is still pointing to `localhost` instead of `mongod`.
- Cloudinary startup failures in local development can be bypassed by setting `CLOUDINARY_STARTUP_CHECK=false`.
- Atlas passwords with special characters may need URL encoding.
