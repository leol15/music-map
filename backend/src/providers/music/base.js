/**
 * Abstract base class for music/playlist providers.
 * Extend this to add a new provider (Apple Music, Tidal, etc.)
 */
class MusicProvider {
  /**
   * @param {string} name - Playlist name
   * @param {string} description - Playlist description
   * @param {Array<{title: string, artist: string}>} songs
   * @returns {Promise<string>} Public URL to the created playlist
   */
  // eslint-disable-next-line no-unused-vars
  async createPlaylist(name, description, songs) {
    throw new Error(`${this.constructor.name} must implement createPlaylist()`);
  }
}

module.exports = MusicProvider;
