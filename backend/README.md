# BaatCheet — Backend

Express + TypeScript API for BaatCheet. Handles auth, chats/messages, file uploads, and Socket.IO (real-time events + WebRTC signaling).

## Requirements

- Node.js 18+
- MongoDB (local, Atlas, or Docker)

## Run locally

```sh
npm install
```

Create `.env` from the sample:

- Windows (PowerShell):
	```sh
	copy .env.sample .env
	```
- macOS / Linux:
	```sh
	cp .env.sample .env
	```

Recommended local values:

```env
PORT=5000
SERVER_URL=https://baatcheet-backend-dweybkd0esdvazfp.westeurope-01.azurewebsites.net

# Vite dev server runs on 5173
FRONTEND_URL=http://localhost:5173

# MongoDB
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
DB_NAME=BaatCheet
```

Start the dev server:

```sh
npm run dev
```

API runs on `https://baatcheet-backend-dweybkd0esdvazfp.westeurope-01.azurewebsites.net`.

## Run with Docker Compose

From the repo root:

```sh
docker compose up --build
```

In Docker, your backend `.env` typically uses:

- `FRONTEND_URL=http://localhost:3002` (the nginx-served frontend)
- `MONGO_URI=mongodb://mongod:27017` (Mongo container name in `docker-compose.yml`)

## Environment variables

All variables are documented in `.env.sample`. A few notes:

- `FRONTEND_URL` supports multiple origins (comma-separated). Example:
	```env
	FRONTEND_URL=http://localhost:5173,http://localhost:3002
	```
- `SERVER_URL` is used to build public links for uploaded files. Set it to the URL users will actually hit.
- Atlas URIs may need URL-encoding if your password has special characters.

MongoDB URL examples:

```text
mongodb://localhost:27017
mongodb://mongod:27017
mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
```

## Scripts

```sh
npm run dev     # nodemon + ts-node (development)
npm run build   # tsc → dist/
npm start       # run already-built server (dist/server.js)
npm run start:full  # build then run dist/server.js
```

## Folder structure

```
src/
├── controllers/   # Request handlers
├── routes/        # Route definitions
├── middlewares/   # Auth, validation, uploads, etc.
├── validators/    # express-validator rules
├── database/      # Mongoose models + repositories
├── socket/        # Socket.IO server + event handlers
├── core/          # ApiError/ApiResponse/JWT helpers
└── server.ts      # Bootstraps Express + Socket.IO
```

## Common issues

- Browser shows CORS errors: check `FRONTEND_URL` in `.env` matches your frontend origin.
- Mongo connection fails in Docker: `MONGO_URI` should use `mongodb://mongod:27017` (not `localhost`).
- Atlas password contains `@`, `#`, etc.: URL-encode it (for example `@` → `%40`).
