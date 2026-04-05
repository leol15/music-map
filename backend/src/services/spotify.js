const axios = require('axios');

const SPOTIFY_API = 'https://api.spotify.com/v1';
const SPOTIFY_ACCOUNTS = 'https://accounts.spotify.com/api/token';

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Get an access token using the stored refresh token (dedicated app account).
 */
async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) return cachedToken;

  const credentials = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');

  const { data } = await axios.post(
    SPOTIFY_ACCOUNTS,
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: process.env.SPOTIFY_REFRESH_TOKEN,
    }),
    { headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;
  return cachedToken;
}

/**
 * Search Spotify for a track and return its URI, or null if not found.
 */
async function searchTrack(title, artist, token) {
  const q = encodeURIComponent(`track:${title} artist:${artist}`);
  const { data } = await axios.get(`${SPOTIFY_API}/search?q=${q}&type=track&limit=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const items = data?.tracks?.items;
  return items?.length ? items[0].uri : null;
}

/**
 * Create a public Spotify playlist on the app account, add tracks, and return the playlist URL.
 */
async function createPlaylist(name, description, trackUris) {
  const token = await getAccessToken();

  // Get app account user ID
  const { data: user } = await axios.get(`${SPOTIFY_API}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Create playlist
  const { data: playlist } = await axios.post(
    `${SPOTIFY_API}/users/${user.id}/playlists`,
    { name, description, public: true },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );

  // Search and collect track URIs
  const uris = (
    await Promise.all(trackUris.map(({ title, artist }) => searchTrack(title, artist, token)))
  ).filter(Boolean);

  // Add tracks
  await axios.post(
    `${SPOTIFY_API}/playlists/${playlist.id}/tracks`,
    { uris },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );

  return playlist.external_urls.spotify;
}

module.exports = { createPlaylist };
