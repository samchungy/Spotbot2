const {loadTokens} = require('./spotify-auth-dal');

/**
 * Checks if our settings is authenticated to save a Spotify API call.
 * @param {string} teamId
 * @param {string} channelId
 */
async function isAuthenticated(teamId, channelId) {
  const tokens = await loadTokens(teamId, channelId);
  if (!tokens || !tokens.accessToken) {
    return false;
  }
  return true;
}

module.exports = {isAuthenticated};
