/**
 * LLM provider factory.
 * Set LLM_PROVIDER env var to select a provider (default: anthropic).
 *
 * Supported values:
 *   anthropic   — Claude via Anthropic API (default)
 *   google      — Gemini via Google GenAI API
 *   gemini-cli  — Local Gemini CLI (no API key required)
 *
 * To add a new provider:
 *   1. Create a class in ./your-provider.js extending LLMProvider
 *   2. Add it to the PROVIDERS map below
 *   3. Set LLM_PROVIDER=your-provider in .env
 */
const PROVIDERS = {
  anthropic:    () => new (require('./anthropic'))(),
  google:       () => new (require('./google'))(),
  'gemini-cli': () => new (require('./gemini-cli'))(),
};

function createLLMProvider() {
  const name = (process.env.LLM_PROVIDER || 'anthropic').toLowerCase();
  const factory = PROVIDERS[name];
  if (!factory) {
    throw new Error(`Unknown LLM_PROVIDER "${name}". Valid options: ${Object.keys(PROVIDERS).join(', ')}`);
  }
  return factory();
}

// Singleton — one provider instance for the lifetime of the process
let instance;
function getLLMProvider() {
  if (!instance) instance = createLLMProvider();
  return instance;
}

module.exports = { getLLMProvider };
