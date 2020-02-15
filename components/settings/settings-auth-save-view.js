const {storeView} = require('/opt/spotify/spotify-auth/spotify-auth-dal');
const {modelView} = require('/opt/settings/settings-model');

/**
 * Saves the view id of our modal after clicking the authenticate button
 * @param {Object} event
 * @param {Object} context
 */
module.exports.handler = async (event, context) => {
  try {
    const {teamId, channelId, triggerId, viewId} = JSON.parse(event.Records[0].Sns.Message);
    const store = modelView(viewId, triggerId);
    await storeView(teamId, channelId, store);
  } catch (error) {
    throw error;
  }
};
