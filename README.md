# Music Map

Describe a mood, vibe, or genre and get an instant Spotify playlist — powered by your choice of LLM.

## How it works

1. User describes what they want _(e.g. "upbeat songs for a morning run")_
2. An LLM recommends songs
3. The backend searches Spotify for each track and creates a public playlist
4. User gets a shareable playlist link and per-song Spotify links

## Stack

| Layer    | Tech                                              |
| -------- | ------------------------------------------------- |
| Frontend | React + Vite → GitHub Pages                       |
| Backend  | Node.js + Express → EC2 + Nginx                   |
| CDN      | CloudFront                                        |
| LLM      | Anthropic / Google GenAI / Gemini CLI (swappable) |
| Music    | Spotify Web API                                   |

---

## Local Development

**1. Clone and install**

```bash
git clone https://github.com/your-username/music-map.git
cd music-map

cd backend && npm install
cd ../frontend && npm install
```

**2. Configure the backend**

```bash
cp backend/.env.example backend/.env
# Fill in your API keys (see Configuration below)
```

**3. Configure the frontend**

```bash
# frontend/.env.local
VITE_API_BASE_URL=http://localhost:3001
VITE_BASE_PATH=/
```

**4. Run**

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Frontend → http://localhost:5173
Backend → http://localhost:3001

---

## Configuration

All backend config lives in `backend/.env`:

```bash
# Server
PORT=3001

# LLM provider — pick one
LLM_PROVIDER=anthropic          # anthropic | google | gemini-cli

# Anthropic (LLM_PROVIDER=anthropic)
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-opus-4-6  # optional

# Google GenAI (LLM_PROVIDER=google)
GOOGLE_API_KEY=
GOOGLE_MODEL=gemini-2.0-flash    # optional

# Gemini CLI (LLM_PROVIDER=gemini-cli) — uses locally installed `gemini`, no API key needed
GEMINI_CLI_CMD=gemini            # optional, path to binary

# Spotify
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REFRESH_TOKEN=           # see below

# CORS
ALLOWED_ORIGINS=https://your-username.github.io,http://localhost:5173

# Debug
MOCK_RECOMMENDATIONS=false       # set to true to skip LLM calls during debugging
RECOMMENDATION_COUNT=10          # default song count
```

### Getting a Spotify Refresh Token

The app uses a dedicated Spotify account to create playlists — users don't need to log in.

1. Create a Spotify app at [developer.spotify.com](https://developer.spotify.com/dashboard)
2. Add `http://127.0.0.1:8888/callback` as a Redirect URI
3. Enable **Web API** under APIs used
4. Add your account email under **User Management**
5. Run the helper script:

```bash
SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=yyy node scripts/get-spotify-token.js
```

6. Log in as the dedicated account and approve — the script prints your `SPOTIFY_REFRESH_TOKEN`

---

## Deployment

### Frontend → GitHub Pages

The workflow triggers automatically on push to `main` when files in `frontend/` change.

Enable GitHub Pages in repo settings:
**Settings → Pages → Source: `gh-pages` branch**

### Backend → EC2

**One-time EC2 setup:**

```bash
# On EC2
cd ~/prod/music-map/backend
npm install
pm2 start src/index.js --name music-map-backend
pm2 save && pm2 startup

sudo cp ~/prod/music-map/nginx/music-map.conf /etc/nginx/default.d/music-map.conf
sudo nginx -t && sudo systemctl reload nginx
```

**Subsequent deploys** happen automatically via GitHub Actions on push to `main`.
