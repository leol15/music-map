/**
 * One-time helper to get your Spotify refresh token for the dedicated app account.
 *
 * Usage:
 *   SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=yyy node scripts/get-spotify-token.js
 *
 *   Log in as the dedicated app account when the browser opens.
 *   Copy the printed SPOTIFY_REFRESH_TOKEN into backend/.env
 */
const http = require("http");

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = "http://127.0.0.1:8888/callback";
// playlist-modify-private — create and modify private playlists (link still works publicly)
// playlist-modify-public  — kept for compatibility
const SCOPES = "playlist-modify-public playlist-modify-private";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "Usage: SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=yyy node scripts/get-spotify-token.js"
  );
  process.exit(1);
}

const authUrl =
  `https://accounts.spotify.com/authorize?` +
  `client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}` +
  `&scope=${encodeURIComponent(SCOPES)}`;

console.log(
  "\nOpen this URL in your browser (log in as the dedicated app account):\n"
);
console.log(authUrl);
console.log("\nWaiting for callback on http://127.0.0.1:8888/callback ...\n");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost:8888");
  const code = url.searchParams.get("code");
  if (!code) {
    res.end("No code.");
    return;
  }

  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
    "base64"
  );
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
  });

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = await tokenRes.json();

  console.log("\n--- Add this to backend/.env ---");
  console.log(`SPOTIFY_REFRESH_TOKEN=${data.refresh_token}`);
  console.log("--------------------------------\n");

  res.end("Done! You can close this tab and stop the script.");
  server.close();
});

server.listen(8888);
