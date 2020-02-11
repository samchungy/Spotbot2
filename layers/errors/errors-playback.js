/**
 * Spotify Playback Error
 */
class PlaybackError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = 'PlaybackError';
  }
}

module.exports = {
  PlaybackError,
};
