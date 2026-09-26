# Convo

A one-to-one chat app with React + Vite, Django REST Framework, JWT authentication, SQLite message history, and Django Channels WebSockets.

## Run locally

Use two terminals in the project folder.

### Django backend (terminal 1)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python -m daphne -b 127.0.0.1 -p 8000 config.asgi:application
```

### React frontend (terminal 2)

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Register an account, then have your friend register their own account. Use **Find a friend** and their username to start a private conversation. Create a second account in another browser or private window to try real-time messages between users.

## Backend routes

- `POST /api/auth/register/` — create an account with `username` and `password` (minimum 8 characters).
- `POST /api/auth/token/` and `/api/auth/token/refresh/` — obtain and refresh JWT tokens.
- `GET /api/auth/me/` — current account.
- `GET /api/users/?q=name` — search usernames.
- `GET/POST /api/conversations/` — list conversations or create/retrieve a one-to-one conversation with `{ "username": "friend" }`.
- `GET /api/conversations/:id/messages/` — load persistent message history.
- `ws://localhost:8000/ws/chat/:id/?token=<access-token>` — authenticated real-time messaging.

For local development, Channels uses an in-memory channel layer. For multi-process deployments, set `REDIS_URL` to use Redis. Set `VITE_API_URL` and `VITE_WS_URL` if the backend runs somewhere other than localhost. Configure a strong `SECRET_KEY`, HTTPS, allowed hosts, and a production database before deployment.

## Free Render test deployment

The repository contains a Django backend and Vite frontend, so deploy them as two Render services plus a PostgreSQL database. Push this repository to a Git provider that Render can access first; this workspace currently has no Git remote.

1. Create a free Render PostgreSQL database and copy its **Internal Database URL**.
2. Create a free **Web Service** for this repo with root directory `backend`, build command `pip install -r requirements.txt`, and start command `python manage.py migrate && python -m daphne -b 0.0.0.0 -p $PORT config.asgi:application`.
3. Set backend environment variables: `SECRET_KEY` to a generated secret, `DEBUG` to `False`, `DATABASE_URL` to the database URL, and `CORS_ALLOWED_ORIGINS` to the frontend's HTTPS origin. Render sets `RENDER_EXTERNAL_HOSTNAME` for the backend automatically.
4. Create a free **Static Site** for the same repo with build command `npm ci && npm run build` and publish directory `dist`.
5. Set frontend build environment variables `VITE_API_URL=https://YOUR-API.onrender.com/api` and `VITE_WS_URL=wss://YOUR-API.onrender.com`. Replace `YOUR-API` with the actual backend service name and redeploy both services.

Free Render web services sleep after 15 minutes without inbound traffic, so the first request after a pause can take about a minute. Free PostgreSQL databases expire after 30 days; use this setup for a temporary test and do not store data you need to keep. See [Render's free instance limits](https://render.com/docs/free).

## Share a local test with ngrok

Vite proxies `/api` and `/ws` to Django, so one ngrok URL exposes the chat frontend, API, and WebSocket together.

1. Install ngrok and add your ngrok auth token using the instructions in the [ngrok quickstart](https://ngrok.com/docs/getting-started/).
2. In terminal 1, start Django from the `backend` directory: `.venv/bin/python -m daphne -b 127.0.0.1 -p 8000 config.asgi:application`.
3. In terminal 2, from the project root, start Vite: `npm run dev`.
4. In terminal 3, run `ngrok http 5173` and share the HTTPS URL it prints with your friend.

Both servers must stay running while your friend uses the link. Stop ngrok when finished; it exposes this development app publicly while the tunnel is active.
