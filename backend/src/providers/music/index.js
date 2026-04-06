/**
 * Music provider factory.
 * Set MUSIC_PROVIDER env var to select a provider (default: spotify).
 *
 * Supported values:
 *   spotify  — Spotify Web API (default)
 *
 * To add a new provider:
 *   1. Create a class in ./your-provider.js extending MusicProvider
 *   2. Add it to the PROVIDERS map below
 *   3. Set MUSIC_PROVIDER=your-provider in .env
 */
const PROVIDERS = {
  spotify: () => new (require('./spotify'))(),
};

function createMusicProvider() {
  const name = (process.env.MUSIC_PROVIDER || 'spotify').toLowerCase();
  const factory = PROVIDERS[name];
  if (!factory) {
    throw new Error(`Unknown MUSIC_PROVIDER "${name}". Valid options: ${Object.keys(PROVIDERS).join(', ')}`);
  }
  return factory();
}

// Singleton — one provider instance for the lifetime of the process
let instance;
function getMusicProvider() {
  if (!instance) instance = createMusicProvider();
  return instance;
}

module.exports = { getMusicProvider };
