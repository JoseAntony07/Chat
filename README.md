# Convo

A one-to-one chat app with React + Vite, Django REST Framework, JWT authentication, SQLite message history, and Django Channels WebSockets.

## Common local commands

Run each service in its own terminal. Start commands are run from the indicated folder unless stated otherwise. First-time setup details are below; the full Xcode and simulator guide is in [mobile/README.md](mobile/README.md).

### Backend (Django + Daphne)

```bash
cd backend
python3 -m venv .venv                 # once: create virtual environment
source .venv/bin/activate
pip install -r requirements.txt       # once, or after requirements change
python manage.py migrate              # apply database migrations
python -m daphne -b 127.0.0.1 -p 8000 config.asgi:application
```

### Web (React + Vite)

```bash
cd web
npm install                           # once, or after package changes
npm run dev                            # http://localhost:5173
npm run build                          # production build into web/dist
npm run preview                        # preview the production build locally
```

### Mobile (React Native + Expo)

```bash
cd mobile
npm install                            # once, or after package changes
npx expo run:ios --device              # build/install/open in iOS Simulator
npx expo start --dev-client            # start Metro for the native development app
npx expo run:android                   # build/install/open in Android emulator
npx expo lint                          # lint
npx tsc --noEmit                       # typecheck
```

Use Node 24 for mobile; nvm is optional. If you have nvm installed, run `nvm use` from `mobile/` first; otherwise install/select Node 24 with your existing Node version manager. The simulator and native build setup are documented in [mobile/README.md](mobile/README.md). Mobile `.env` URLs must point directly to Django (`127.0.0.1` for iOS Simulator, `10.0.2.2` for Android Emulator, Mac Wi-Fi IP for a physical device).

### Redis (optional local Channels service)

Run these from the repository root. Redis is only used for temporary real-time channel events; without `REDIS_URL`, a single local backend process uses the in-memory Channels layer.

```bash
test -f backend/.env || cp backend/.env.example backend/.env  # create once; preserve existing settings
# Edit backend/.env and uncomment REDIS_URL to enable Redis.
docker compose up -d redis               # start Redis container
docker compose ps                        # check container status
docker compose exec redis redis-cli      # open Redis CLI
docker compose stop redis                # stop, keep container
docker compose start redis               # restart stopped container
docker compose down                      # stop and remove container
```

From `redis-cli`, use `PING` and `SCAN 0` to inspect Redis. Keep Redis running when `REDIS_URL` is enabled in `backend/.env`.

### Handy project commands

```bash
(cd backend && source .venv/bin/activate && python manage.py check)
(cd backend && source .venv/bin/activate && python manage.py makemigrations)
(cd backend && source .venv/bin/activate && python manage.py migrate)
(cd mobile && npx expo-doctor)
```

For development with phone access, Redis details, backend endpoints, deployment, and ngrok, see the sections below. Do not commit local `.env` files or secrets.

## Run locally

Use two terminals. Run backend commands from `backend/` and web commands from `web/`.

### Django backend (terminal 1)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python -m daphne -b 127.0.0.1 -p 8000 config.asgi:application
```

### React web frontend (terminal 2)

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:5173`. Register an account, then have your friend register their own account. Use **Find a friend** and their username to start a private conversation. Create a second account in another browser or private window to try real-time messages between users.

## React Native mobile app

The Expo app in `mobile/` uses the same Django API, accounts, conversations, message history, and WebSocket chat as the React web app.

### First-time setup

The app's `mobile/.nvmrc` selects Node.js 24 when using nvm. From the repository root, install the runtime and app dependencies and create the mobile environment file:

```bash
cd mobile
nvm install
nvm use
cp .env.example .env
npm install
```

Edit `mobile/.env` and choose the backend address that your target can reach:

| Target | `EXPO_PUBLIC_API_URL` | `EXPO_PUBLIC_WS_URL` |
| --- | --- | --- |
| iOS Simulator | `http://127.0.0.1:8000/api` | `ws://127.0.0.1:8000` |
| Android Emulator | `http://10.0.2.2:8000/api` | `ws://10.0.2.2:8000` |
| Physical phone | `http://MAC_WIFI_IP:8000/api` | `ws://MAC_WIFI_IP:8000` |

For a physical phone, replace `MAC_WIFI_IP` with your Mac's Wi-Fi IP (`ipconfig getifaddr en0`) and connect the phone and Mac to the same Wi-Fi network.

### Start the backend and Expo

Use one terminal for Django. Start it from `backend/`. The iOS Simulator can use `127.0.0.1`; use `0.0.0.0` for Android Emulator or a physical phone so the device can reach the Mac:

```bash
cd backend
source .venv/bin/activate
python -m daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

For Android Emulator or a physical phone, make sure `backend/.env` allows the device address. For a phone, include your Mac Wi-Fi IP in `ALLOWED_HOSTS` and add the backend origin to `WEBSOCKET_EXTRA_ALLOWED_ORIGINS` so Django Channels accepts its WebSocket connection. Example for a phone at `192.168.1.25` (replace with your IP):

```env
ALLOWED_HOSTS=localhost,127.0.0.1,10.0.2.2,192.168.1.25
WEBSOCKET_EXTRA_ALLOWED_ORIGINS=http://192.168.1.25:8000
```

Use another terminal to start Expo:

```bash
cd mobile
npm start
```

Scan the QR code with Expo Go on a physical phone, or press `i`/`a` in the Expo terminal to open an installed iOS Simulator/Android Emulator. If you change `mobile/.env`, restart Expo with `npx expo start -c` to reload the URLs. The Expo API and WebSocket URLs are public app configuration, not secrets. For a hosted backend, use its HTTPS and WSS URLs. Mobile connects directly to Django; Vite's `/api` and `/ws` development proxy is only for the web app.

### Optional: use Redis locally

The default local setup uses Django Channels' in-memory layer, which is enough when running a single backend process. To try the same Redis-backed channel layer used for multi-process hosting, install and start Docker Desktop. The backend loads `backend/.env` automatically; copy the example once if you don't already have the file:

```bash
cp backend/.env.example backend/.env
```

Now use three terminals. Run the Redis and Compose commands from the project root:

**Terminal 1 — start Redis** (from the project root):

```bash
docker compose up -d redis
```

Check that the container is running:

```bash
docker compose ps
```

Open the Redis command-line client:

```bash
docker compose exec redis redis-cli
```

At the Redis prompt, check the connection and inspect current keys:

```text
PING
SCAN 0
```

Redis is used here for temporary Channels events, not as the chat history database. Keys may disappear when events expire or when Redis restarts.

To stop Redis but keep its container:

```bash
docker compose stop redis
```

Start the stopped container again:

```bash
docker compose start redis
```

To stop and remove the container:

```bash
docker compose down
```

**Terminal 2 — start Django with Redis enabled** (from the project root):

```bash
cd backend
source .venv/bin/activate
python -m daphne -b 127.0.0.1 -p 8000 config.asgi:application
```

**Terminal 3 — start the React web app**:

```bash
cd web
npm run dev
```

Keep Redis running while using the app. `backend/.env` is ignored by Git, so local environment settings are not committed. If Redis is not running or `REDIS_URL` is unset, the backend uses its in-memory channel layer. After changing Python dependencies, install them with `pip install -r requirements.txt` from `backend` while the virtual environment is active.

## Frontend structure

The React code is grouped by responsibility so UI, API calls, and application state are easier to find:

```text
web/src/
├── app/                  # App-wide session and screen selection
├── components/           # Small UI pieces reused in multiple screens
├── features/
│   ├── auth/              # Login/register page and authentication API
│   └── chat/              # Chat page, conversation UI, chat API, WebSocket hook
├── lib/                  # Shared utilities, including the HTTP API client
├── main.jsx              # React entry point
└── styles.css            # Global app styles
```

Start at `web/src/main.jsx`: it mounts `App`. `App` checks the saved login and chooses the login page or chat page. The chat feature is responsible for conversations and messages. Feature API modules call the shared `web/src/lib/apiClient.js`, while `useChatSocket.js` manages the live message connection. Reusable display pieces such as `Avatar` live under `web/src/components/`.

## Backend routes

- `POST /api/auth/register/` — create an account with `username` and `password` (minimum 8 characters).
- `POST /api/auth/token/` and `/api/auth/token/refresh/` — obtain and refresh JWT tokens.
- `GET /api/auth/me/` — current account.
- `GET /api/users/?q=name` — search usernames.
- `GET/POST /api/conversations/` — list conversations or create/retrieve a one-to-one conversation with `{ "username": "friend" }`.
- `GET /api/conversations/:id/messages/` — load persistent message history.
- `ws://localhost:8000/ws/chat/:id/?token=<access-token>` — authenticated real-time messaging.

For local development, Channels uses an in-memory channel layer unless `REDIS_URL` is set; see the optional Redis setup above. For multi-process deployments, set `REDIS_URL` to a Redis-compatible service so backend processes can share channel events. Set `VITE_API_URL` and `VITE_WS_URL` in `web/.env` or the frontend hosting service if the backend runs somewhere other than localhost. Configure a strong `SECRET_KEY`, HTTPS, allowed hosts, and a production database before deployment.

## Free Render test deployment

The repository contains a Django backend and Vite frontend, so deploy them as two Render services plus a PostgreSQL database. Push this repository to a Git provider that Render can access first; this workspace currently has no Git remote.

1. Create a free Render PostgreSQL database and copy its **Internal Database URL**.
2. Create a free **Web Service** for this repo with root directory `backend`, build command `pip install -r requirements.txt`, and start command `python manage.py migrate && python -m daphne -b 0.0.0.0 -p $PORT config.asgi:application`.
3. Set backend environment variables: `SECRET_KEY` to a generated secret, `DEBUG` to `False`, `DATABASE_URL` to the database URL, and `CORS_ALLOWED_ORIGINS` to the frontend's HTTPS origin. Render sets `RENDER_EXTERNAL_HOSTNAME` for the backend automatically.
4. Create a free **Static Site** for the same repo with root directory `web`, build command `npm ci && npm run build`, and publish directory `dist` (relative to `web/`).
5. Set frontend build environment variables `VITE_API_URL=https://YOUR-API.onrender.com/api` and `VITE_WS_URL=wss://YOUR-API.onrender.com`. Replace `YOUR-API` with the actual backend service name and redeploy both services.

Free Render web services sleep after 15 minutes without inbound traffic, so the first request after a pause can take about a minute. Free PostgreSQL databases expire after 30 days; use this setup for a temporary test and do not store data you need to keep. See [Render's free instance limits](https://render.com/docs/free).

## Share a local test with ngrok

Vite proxies `/api` and `/ws` to Django, so one ngrok URL exposes the chat frontend, API, and WebSocket together.

1. Install ngrok and add your ngrok auth token using the instructions in the [ngrok quickstart](https://ngrok.com/docs/getting-started/).
2. In terminal 1, start Django from the `backend` directory: `.venv/bin/python -m daphne -b 127.0.0.1 -p 8000 config.asgi:application`.
3. In terminal 2, start the web app: `cd web && npm run dev`.
4. In terminal 3, run `ngrok http 5173` and share the HTTPS URL it prints with your friend.

Both servers must stay running while your friend uses the link. Stop ngrok when finished; it exposes this development app publicly while the tunnel is active.
