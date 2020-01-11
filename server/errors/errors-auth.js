/**
 * Spotify Authentication Error
 */
class AuthError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Spotify Premium Error
 */
class PremiumError extends AuthError {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = 'PremiumError';
  }
}

module.exports = {
  AuthError,
  PremiumError,
};
