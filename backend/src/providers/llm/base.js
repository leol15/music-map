/**
 * Abstract base class for LLM providers.
 * Extend this to add a new provider (OpenAI, Ollama, etc.)
 */
class LLMProvider {
  /**
   * @param {string} prompt - User's natural language music request
   * @returns {Promise<Array<{title: string, artist: string}>>}
   */
  // eslint-disable-next-line no-unused-vars
  async recommendSongs(prompt, count = 10) {
    throw new Error(`${this.constructor.name} must implement recommendSongs()`);
  }
}

module.exports = LLMProvider;
