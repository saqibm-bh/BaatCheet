# BaatCheet Frontend

React + Vite client for BaatCheet. This app handles the chat UI, AI interaction layer, private AI view, real-time updates, media previews, and WebRTC calling experience.

## What This App Covers

- Login and registration flows
- Real-time chat UI for 1-on-1 and group chats
- Embedded AI assistant triggers like `@AI` and `/ai`
- Private AI mode toggle inside chats
- Streaming AI response rendering
- Media attachments, previews, and downloads
- Message editing, reactions, search, and summaries
- WebRTC video calling
- Theming and polished desktop-first chat UX

## Frontend Highlights

- Uses React context to coordinate auth, chat, socket, and WebRTC state.
- Splits network and socket logic into hooks like `useChatMessages` and `useChatSocketListeners`.
- Renders AI markdown responses progressively during live streams.
- Filters private AI messages in the UI so hidden responses stay visible only to the requester.
- Uses Tailwind plus CSS variables for theming and layout consistency.

## Requirements

- Node.js 18+
- Running BaatCheet backend on `http://localhost:5000` or your deployed API URL

## Run Locally

### 1. Install

```bash
npm install
```

### 2. Create `.env`

You can copy the sample:

```bash
copy .env.sample .env
```

Recommended local config:

```env
VITE_API_URL=http://localhost:5000
VITE_SERVER_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_SIGNALING_URL=http://localhost:5000
```

Important note: the current socket and WebRTC layers read `VITE_SERVER_URL`, so keep that set even if `VITE_API_URL` is present.

### 3. Start dev server

```bash
npm run dev
```

Open `http://localhost:5173`.

If install fails because of dependency resolution on your machine, try:

```bash
npm install --legacy-peer-deps
```

## Docker

From the repo root:

```bash
docker compose up --build
```

In Docker, the frontend is served through nginx on `http://localhost:3002`.

## Environment Variables

- `VITE_API_URL`: Base URL for HTTP API requests.
- `VITE_SERVER_URL`: Base URL currently used by Socket.IO and WebRTC connection logic.
- `VITE_SOCKET_URL`: Present in the sample env as an optional override.
- `VITE_SIGNALING_URL`: Present in the sample env as an optional override.

Legacy compatibility still exists for:

- `VITE_SERVER_URL`
- `VITE_SOCKET_URI`
- `VITE_SIGNALLING_SERVER_URL`

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## App Structure

```text
src/
|-- api/          # Axios helpers and request functions
|-- assets/       # Icons, images, audio
|-- components/   # Chat UI and shared interface pieces
|-- context/      # Auth, chat, socket, theme, WebRTC state
|-- hooks/        # Reusable message and socket logic
|-- pages/        # Login, register, chat
|-- config/       # Runtime env helpers
|-- utils/        # Client helpers
|-- App.jsx
`-- main.jsx
```

## UX Features Worth Calling Out

- AI replies stream live into the timeline before the final message lands.
- Private AI mode visually marks hidden assistant responses as visible only to the current user.
- Group chats display sender labels, reactions, search matches, and attachment previews cleanly.
- WebRTC calling is wired into the same product flow instead of living as a separate demo.

## Common Issues

- If the app loads but requests fail, check `VITE_API_URL`.
- If sockets are not connecting, verify `VITE_SERVER_URL`.
- If video calling fails, confirm the backend is reachable and the browser has camera and mic permission.
- If CORS errors appear, make sure backend `FRONTEND_URL` matches your frontend origin.
