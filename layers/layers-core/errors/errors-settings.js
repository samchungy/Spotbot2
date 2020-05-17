/**
 * Setup Error
 */
class SetupError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = 'SetupError';
  }
}

/**
 * Settings Error
 */
class SettingsError extends SetupError {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = 'SettingsError';
  }
}

/**
 * Admin Error
 */
class ChannelAdminError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = 'ChannelAdminError';
  }
}
module.exports = {
  ChannelAdminError,
  SettingsError,
  SetupError,
};

