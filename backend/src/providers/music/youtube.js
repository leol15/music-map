const axios = require('axios');
const MusicProvider = require('./base');

const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

class YouTubeQuotaError extends Error {
  constructor() {
    super('YouTube daily quota exceeded. The playlist could not be created — please try again tomorrow or switch to Spotify.');
    this.name = 'YouTubeQuotaError';
  }
}

class YouTubeProvider extends MusicProvider {
  constructor() {
    super();
    this.clientId = process.env.YOUTUBE_CLIENT_ID;
    this.clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    this.refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
    this._token = null;
    this._tokenExpiresAt = 0;
  }

  async _getAccessToken() {
    if (this._token && Date.now() < this._tokenExpiresAt - 60_000) return this._token;

    const { data } = await axios.post(TOKEN_URL, new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: this.refreshToken,
      grant_type: 'refresh_token',
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

    if (!data.access_token) {
      console.error(`[youtube] token refresh failed:`, JSON.stringify(data));
      throw new Error(`YouTube token refresh failed: ${data.error} — ${data.error_description}`);
    }
    this._token = data.access_token;
    this._tokenExpiresAt = Date.now() + data.expires_in * 1000;
    console.log(`[youtube] access token acquired`);
    return this._token;
  }

  _checkQuota(err) {
    const errors = err.response?.data?.error?.errors ?? [];
    const isQuota = errors.some(e =>
      e.reason === 'quotaExceeded' || e.reason === 'rateLimitExceeded'
    );
    if (isQuota || err.response?.status === 429) throw new YouTubeQuotaError();
  }

  async _searchVideo(title, artist, token) {
    const q = `${title} ${artist} official`;
    const { data } = await axios.get(`${YOUTUBE_API}/search`, {
      params: { q, part: 'snippet', type: 'video', videoCategoryId: '10', maxResults: 1 },
      headers: { Authorization: `Bearer ${token}` },
    });
    const item = data?.items?.[0];
    if (!item) return null;
    const videoId = item.id?.videoId;
    return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
  }

  async createPlaylist(name, description, songs) {
    console.log(`[youtube] creating playlist "${name}" with ${songs.length} songs`);
    const token = await this._getAccessToken();

    // Create playlist
    let playlist;
    try {
      ({ data: playlist } = await axios.post(`${YOUTUBE_API}/playlists`, {
        snippet: { title: name, description },
        status: { privacyStatus: 'unlisted' },
      }, {
        params: { part: 'snippet,status' },
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      }));
    } catch (err) {
      this._checkQuota(err);
      throw err;
    }
    const playlistId = playlist.id;
    console.log(`[youtube] playlist created: ${playlistId}`);

    // Search and add videos sequentially to preserve order
    const tracks = [];
    let matched = 0;
    for (const { title, artist } of songs) {
      const videoUrl = await this._searchVideo(title, artist, token);
      if (videoUrl) {
        const videoId = new URL(videoUrl).searchParams.get('v');
        try {
          await axios.post(`${YOUTUBE_API}/playlistItems`, {
            snippet: { playlistId, resourceId: { kind: 'youtube#video', videoId } },
          }, {
            params: { part: 'snippet' },
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          });
        } catch (err) {
          this._checkQuota(err);
          throw err;
        }
        matched++;
      }
      tracks.push({ title, artist, url: videoUrl });
    }

    const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
    console.log(`[youtube] matched ${matched}/${songs.length} videos`);
    console.log(`[youtube] playlist ready: ${playlistUrl}`);
    return { playlistUrl, tracks };
  }
}

module.exports = YouTubeProvider;
