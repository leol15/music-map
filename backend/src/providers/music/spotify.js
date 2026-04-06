const axios = require("axios");
const MusicProvider = require("./base");

const SPOTIFY_API = "https://api.spotify.com/v1";
const SPOTIFY_ACCOUNTS = "https://accounts.spotify.com/api/token";

class SpotifyProvider extends MusicProvider {
  constructor() {
    super();
    this.clientId = process.env.SPOTIFY_CLIENT_ID;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    this.refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
    this._token = null;
    this._tokenExpiresAt = 0;
  }

  async _getAccessToken() {
    if (this._token && Date.now() < this._tokenExpiresAt - 60_000)
      return this._token;

    const credentials = Buffer.from(
      `${this.clientId}:${this.clientSecret}`
    ).toString("base64");
    const { data } = await axios.post(
      SPOTIFY_ACCOUNTS,
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: this.refreshToken,
      }),
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    this._token = data.access_token;
    this._tokenExpiresAt = Date.now() + data.expires_in * 1000;
    console.log(`[spotify] token scopes: ${data.scope}`);
    return this._token;
  }

  async _searchTrack(title, artist, token) {
    const q = encodeURIComponent(`track:${title} artist:${artist}`);
    const { data } = await axios.get(
      `${SPOTIFY_API}/search?q=${q}&type=track&limit=1`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const track = data?.tracks?.items?.[0];
    if (!track) return null;
    return {
      uri: track.uri,
      spotifyUrl: track.external_urls?.spotify ?? null,
    };
  }

  async createPlaylist(name, description, songs) {
    console.log(
      `[spotify] creating playlist "${name}" with ${songs.length} songs`
    );
    const token = await this._getAccessToken();
    console.log(`[spotify] access token acquired`);

    const { data: user } = await axios.get(`${SPOTIFY_API}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`[spotify] authenticated as ${user.id}`);

    console.log(`[spotify] creating playlist for user ${user.id}`);
    const { data: playlist } = await axios.post(
      `${SPOTIFY_API}/me/playlists`,
      { name, description, public: false },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`[spotify] playlist created: ${playlist.id}`);

    const results = await Promise.all(
      songs.map(async ({ title, artist }) => {
        const match = await this._searchTrack(title, artist, token);
        return { title, artist, spotifyUrl: match?.spotifyUrl ?? null, uri: match?.uri ?? null };
      })
    );

    const matched = results.filter(r => r.uri);
    console.log(`[spotify] matched ${matched.length}/${songs.length} tracks`);
    console.log(`[spotify] adding ${matched.length} tracks to playlist ${playlist.id}`);

    await axios.post(
      `${SPOTIFY_API}/playlists/${playlist.id}/items`,
      { uris: matched.map(r => r.uri) },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );

    console.log(`[spotify] playlist ready: ${playlist.external_urls.spotify}`);
    return {
      playlistUrl: playlist.external_urls.spotify,
      tracks: results.map(({ title, artist, spotifyUrl }) => ({ title, artist, spotifyUrl })),
    };
  }
}

module.exports = SpotifyProvider;
