const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);
const moment = require(process.env.MOMENT);
// const axios = require('axios');

const SONOS_TOKEN = process.env.SONOS_TOKEN;

const {postEphemeral, updateModal} = require('/opt/slack/slack-api');
const {slackModal} = require('/opt/slack/format/slack-format-modal');
const {ephemeralPost} = require('/opt/slack/format/slack-format-reply');
const {storeState} = require('/opt/sonos/sonos-auth/sonos-auth-interface');
// const {sonosAuthSession} = require('/opt/sonos/sonos-auth/sonos-auth-session');
const {modelState} = require('/opt/settings/settings-model');
const transform = require('/opt/utils/util-transform');
// const {getAuthBlock} = require('./layers/settings-sonos-blocks');

const SONOS_MODAL = config.slack.actions.sonos_modal;

const OPEN_RESPONSE = {
  fail: ':x: Something went wrong! Could not open Sonos Settings. Please try again.',
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, viewId, userId, url} = JSON.parse(event.Records[0].Sns.Message);
  try {
    // const {authBlock, authError} = await getAuthBlock(teamId, channelId, viewId, url);
    // Do not load settings blocks if Spotify is not authenticated
    // const blocks = [
    //   ...authBlock,
    //   ...!authError ? await getSettingsBlocks(settings) : [],
    // ];
    // const auth = await sonosAuthSession(teamId, channelId);
    // const households = await fetchHouseholds(auth);
    const redirectUri = encodeURIComponent(`${url}/sonos-auth-callback`);
    const state = modelState(teamId, channelId, viewId);
    await storeState(teamId, channelId, {state: state}, moment().add(1, 'hour').unix());
    const urlState = encodeURIComponent(transform.encode64(JSON.stringify(state)));
    const sonosUrl = `https://api.sonos.com/login/v3/oauth?client_id=${SONOS_TOKEN}&response_type=code&state=${urlState}&scope=playback-control-all&redirect_uri=${redirectUri}`;
    const blocks = [
      {
        'block_id': 'SONOS_AUTH',
        'type': 'section',
        'text': {
          'type': 'mrkdwn',
          'text': 'Click to authenticate with Sonos.',
        },
        'accessory': {
          'type': 'button',
          'text': {
            'type': 'plain_text',
            'text': ':link: Authenticate with Sonos',
            'emoji': true,
          },
          'url': sonosUrl,
          'action_id': 'SONOS_AUTH',
        },
      },
      {
        'type': 'section',
        'text': {
          'type': 'mrkdwn',
          'text': 'Edit Sonos Groups',
        },
        'accessory': {
          'type': 'button',
          'text': {
            'type': 'plain_text',
            'text': 'Edit',
            'emoji': true,
          },
          'value': 'SONOS_GROUPS',
          'action_id': 'SONOS_GROUPS',
        },
      },
    ];
    const modal = slackModal(SONOS_MODAL, `Sonos Settings`, `Save`, `Cancel`, blocks, false, channelId);
    await updateModal(viewId, modal);
  } catch (error) {
    logger.error('Open Sonos Settings Failed');
    logger.error(error);
    try {
      await postEphemeral(
          ephemeralPost(channelId, userId, OPEN_RESPONSE.fail, null),
      );
    } catch (error) {
      logger.error('Failed to report open Sonos settings failed');
      logger.error(error);
    }
  }
};
