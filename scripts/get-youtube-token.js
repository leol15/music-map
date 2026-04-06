/**
 * One-time helper to get your YouTube refresh token for the dedicated app account.
 *
 * Setup:
 *   1. Go to console.cloud.google.com → APIs & Services → Credentials
 *   2. Create an OAuth 2.0 Client ID (type: Web application)
 *   3. Add http://127.0.0.1:8888/callback as an Authorized redirect URI
 *   4. Enable the YouTube Data API v3 for your project
 *
 * Usage:
 *   YOUTUBE_CLIENT_ID=xxx YOUTUBE_CLIENT_SECRET=yyy node scripts/get-youtube-token.js
 *
 *   Log in as the dedicated app account when the browser opens.
 *   Copy the printed YOUTUBE_REFRESH_TOKEN into backend/.env
 */
const http = require('http');

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const REDIRECT_URI = 'http://127.0.0.1:8888/callback';
const SCOPES = 'https://www.googleapis.com/auth/youtube';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Usage: YOUTUBE_CLIENT_ID=xxx YOUTUBE_CLIENT_SECRET=yyy node scripts/get-youtube-token.js');
  process.exit(1);
}

const authUrl =
  `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=code` +
  `&scope=${encodeURIComponent(SCOPES)}` +
  `&access_type=offline` +
  `&prompt=consent`;

console.log('\nOpen this URL in your browser (log in as the dedicated app account):\n');
console.log(authUrl);
console.log('\nWaiting for callback on http://127.0.0.1:8888/callback ...\n');

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1:8888');
  const code = url.searchParams.get('code');
  if (!code) { res.end('No code.'); return; }

  const body = new URLSearchParams({
    code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
  });

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await tokenRes.json();

  if (!data.refresh_token) {
    console.error('\nNo refresh_token in response. Try revoking app access at');
    console.error('https://myaccount.google.com/permissions and running the script again.\n');
    res.end('Error — check your terminal.');
    server.close();
    return;
  }

  console.log('\n--- Add these to backend/.env ---');
  console.log(`YOUTUBE_CLIENT_ID=${CLIENT_ID}`);
  console.log(`YOUTUBE_CLIENT_SECRET=${CLIENT_SECRET}`);
  console.log(`YOUTUBE_REFRESH_TOKEN=${data.refresh_token}`);
  console.log('---------------------------------\n');

  res.end('Done! You can close this tab and stop the script.');
  server.close();
});

server.listen(8888);
