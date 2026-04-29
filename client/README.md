# BaatCheet — Frontend

React app for BaatCheet (Vite + Tailwind). Talks to the backend over HTTP and Socket.IO.

## Requirements

- Node.js 18+
- Backend running at `https://baatcheet-backend-dweybkd0esdvazfp.westeurope-01.azurewebsites.net`

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

Typical local values:

```env
VITE_API_URL=https://baatcheet-backend-dweybkd0esdvazfp.westeurope-01.azurewebsites.net

# Optional overrides (if omitted, these fall back to VITE_API_URL)
VITE_SOCKET_URL=https://baatcheet-backend-dweybkd0esdvazfp.westeurope-01.azurewebsites.net
VITE_SIGNALING_URL=https://baatcheet-backend-dweybkd0esdvazfp.westeurope-01.azurewebsites.net
```

Start the dev server:

```sh
npm run dev
```

Open `http://localhost:5173`.

> If `npm install` fails with a peer dependency conflict, try `npm install --legacy-peer-deps`.

## Run with Docker Compose

When you run `docker compose up --build` from the repo root, the frontend is served by nginx on:

- `http://localhost:3002`

In that setup, the backend must allow `http://localhost:3002` via `FRONTEND_URL`.

## Environment variables

- All client env vars must start with `VITE_` (this is a Vite rule).
- `VITE_API_URL` is the API base URL used by Axios.
- `VITE_SOCKET_URL` is the Socket.IO server URL (optional, defaults to `VITE_API_URL`).
- `VITE_SIGNALING_URL` is used for video call signaling (optional, defaults to `VITE_SOCKET_URL` then `VITE_API_URL`).

Legacy compatibility:

- The app still accepts `VITE_SERVER_URL`, `VITE_SOCKET_URI`, and `VITE_SIGNALLING_SERVER_URL` if present.

## Scripts

```sh
npm run dev       # Vite dev server
npm run build     # Production build
npm run preview   # Preview the production build
npm run lint      # ESLint
```

## Code structure (quick tour)

The UI stays mostly “dumb” and reads state from context. Network/socket logic lives in hooks.

```
src/
├── api/           # API helper functions
├── components/    # UI components
├── context/       # App-wide state (auth/chat/socket)
├── hooks/         # Reusable logic (messages, socket listeners, composer, etc.)
├── pages/         # Login / Register / Chat
└── utils/         # Small client utilities
```

Styling is Tailwind + CSS variables (see `src/index.css`). That’s what makes light/dark theming work cleanly.

## Common issues

- App loads but requests fail: check `VITE_API_URL` points to your backend.
- Real-time events not working: check `VITE_SOCKET_URL` (or `VITE_API_URL`) and that the backend is running.
- CORS errors: backend `FRONTEND_URL` must match your frontend origin (5173 for local, 3002 for Docker).
