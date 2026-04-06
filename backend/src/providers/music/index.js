/**
 * Music provider factory.
 * Providers can be selected at runtime per-request via getMusicProvider(name),
 * or fall back to the MUSIC_PROVIDER env var (default: spotify).
 *
 * Supported values:
 *   spotify  — Spotify Web API (default)
 *   youtube  — YouTube Data API v3
 *
 * To add a new provider:
 *   1. Create a class in ./your-provider.js extending MusicProvider
 *   2. Add it to the PROVIDERS map below
 */
const PROVIDERS = {
  spotify: () => new (require('./spotify'))(),
  youtube: () => new (require('./youtube'))(),
};

// One singleton instance per provider name
const instances = {};

function getMusicProvider(name) {
  const key = (name || process.env.MUSIC_PROVIDER || 'spotify').toLowerCase();
  if (!PROVIDERS[key]) {
    throw new Error(`Unknown music provider "${key}". Valid options: ${Object.keys(PROVIDERS).join(', ')}`);
  }
  if (!instances[key]) instances[key] = PROVIDERS[key]();
  return instances[key];
}

module.exports = { getMusicProvider };
