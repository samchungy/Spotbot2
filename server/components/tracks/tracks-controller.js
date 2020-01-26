const logger = require('pino')();
const {findAndStore} = require('./tracks-find');
const {post} = require('../slack/slack-api');
const {ephemeralPost} = require('../slack/format/slack-format-reply');


/**
 * Jumps to start of playlist on Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {String} userId
 * @param {String} query
 */
async function find(teamId, channelId, userId, query) {
  try {
    const {success, response, status} = await findAndStore(teamId, channelId, query);
    // if (!success) {
    //   await updatePanel(timestamp, channelId, response, status);
    // } else {
    //   await Promise.all([
    //     updatePanel(timestamp, channelId, null, status),
    //     post(
    //         ephemeralPost(channelId, userId, response, null),
    //     ),
    //   ]);
    // }
  } catch (error) {
    logger.error(error);
  }
}

module.exports = {
  find,
};
