<div align="center">

# BaatCheet

Real-time chat app with private/group messaging, file sharing, and video calling.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

</div>

## What’s in this repo

- Backend API (Express + TypeScript): [backend/](backend/)
- Frontend app (React + Vite + Tailwind): [client/](client/)

Docs:
- Backend setup: [backend/README.md](backend/README.md)
- Frontend setup: [client/README.md](client/README.md)

## Features

- Real-time messaging (private + group chats)
- File sharing (uploads + downloads)
- Message deletion synced to everyone in the chat
- Video calling via WebRTC (signaling over Socket.IO)
- Light/dark theme + polished UI

## Screenshots

| Light | Dark |
|---|---|
| ![Chat (light)](screenshots/hero_light1.png) | ![Chat (dark)](screenshots/hero_dark1.png) |

More in [screenshots/](screenshots/).

## Quickstart (local dev)

### Prerequisites

- Node.js 18+
- MongoDB:
	- Option A: local MongoDB (`mongodb://localhost:27017`)
	- Option B: MongoDB Atlas (`mongodb+srv://...`)

### 1) Backend

```sh
cd backend
npm install
```

Create `backend/.env` from the sample:

- Windows (PowerShell):
	```sh
	copy .env.sample .env
	```
- macOS / Linux:
	```sh
	cp .env.sample .env
	```

For local dev, make sure these values match your machine:

```env
# backend/.env (production-ready defaults)
PORT=5000
SERVER_URL=https://baatcheet-backend-dweybkd0esdvazfp.westeurope-01.azurewebsites.net

# Vite dev server runs on 5173
FRONTEND_URL=http://localhost:5173

# MongoDB
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
DB_NAME=BaatCheet
```

Start the API:

```sh
npm run dev
```

API runs on `https://baatcheet-backend-dweybkd0esdvazfp.westeurope-01.azurewebsites.net`.

### 2) Frontend

```sh
cd client
npm install
```

Create `client/.env` from the sample:

- Windows (PowerShell):
	```sh
	copy .env.sample .env
	```
- macOS / Linux:
	```sh
	cp .env.sample .env
	```

For local dev, typical values are:

```env
VITE_SERVER_URL=https://baatcheet-backend-dweybkd0esdvazfp.westeurope-01.azurewebsites.net
VITE_SOCKET_URI=https://baatcheet-backend-dweybkd0esdvazfp.westeurope-01.azurewebsites.net

# For local testing you can point signaling to the same server
VITE_SIGNALLING_SERVER_URL=https://baatcheet-backend-dweybkd0esdvazfp.westeurope-01.azurewebsites.net
```

Run the app:

```sh
npm run dev
```

Open `http://localhost:5173`.

> If `npm install` hits a peer dependency conflict, try `npm install --legacy-peer-deps`.

## Run with Docker (optional)

This repo includes `docker-compose.yml`.

```sh
docker compose up --build
```

- Backend: `https://baatcheet-backend-dweybkd0esdvazfp.westeurope-01.azurewebsites.net`
- Frontend (nginx): `http://localhost:3002`

When running via Docker, use the provided `.env.sample` values (notably `FRONTEND_URL=http://localhost:3002` and `MONGO_URI=mongodb://mongod:27017`).

## Project layout (high level)

```
.
├── backend/
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── middlewares/
│       ├── database/
│       ├── socket/
│       └── server.ts
├── client/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── pages/
│       └── api/
└── docker-compose.yml
```

## Troubleshooting

- CORS error in browser: make sure `backend/.env` has `FRONTEND_URL` set to your frontend origin.
- Atlas URI with special characters: URL-encode your password (`@` → `%40`, `#` → `%23`, etc.).
- Socket connection issues: ensure `VITE_SOCKET_URI` points to the backend (default `https://baatcheet-backend-dweybkd0esdvazfp.westeurope-01.azurewebsites.net`).

## Contributing

Issues and PRs are welcome. If you’re planning a bigger change, open an issue first so we can align on the approach.

## License

No license file is included in this repository right now. If you plan to publish/distribute it, add a license that matches your intent.
