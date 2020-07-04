const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);
const moment = require(process.env.MOMENT);
const axios = require('axios');

const SONOS_TOKEN = process.env.SONOS_TOKEN;

const {postEphemeral, updateModal} = require('/opt/slack/slack-api');
const {slackModal} = require('/opt/slack/format/slack-format-modal');
const {ephemeralPost} = require('/opt/slack/format/slack-format-reply');
const {storeState} = require('/opt/sonos/sonos-auth/sonos-auth-interface');
const {sonosAuthSession} = require('/opt/sonos/sonos-auth/sonos-auth-session');
const {modelState} = require('/opt/settings/settings-model');
const transform = require('/opt/utils/util-transform');
// const {getAuthBlock} = require('./layers/settings-sonos-blocks');

const SONOS_MODAL = config.slack.actions.sonos_modal;

const OPEN_RESPONSE = {
  fail: ':x: Something went wrong! Could not open Sonos Settings. Please try again.',
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, viewId, userId} = JSON.parse(event.Records[0].Sns.Message);
  try {
    // const {authBlock, authError} = await getAuthBlock(teamId, channelId, viewId, url);
    // Do not load settings blocks if Spotify is not authenticated
    // const blocks = [
    //   ...authBlock,
    //   ...!authError ? await getSettingsBlocks(settings) : [],
    // ];
    // const auth = await sonosAuthSession(teamId, channelId);
    // const households = await fetchHouseholds(auth);
    // const redirectUri = encodeURIComponent(`${url}/${process.env.ENV}/sonos-auth-callback`);
    // const state = modelState(teamId, channelId, viewId);
    // await storeState(teamId, channelId, {state: state}, moment().add(1, 'hour').unix());
    // const urlState = encodeURIComponent(transform.encode64(JSON.stringify(state)));
    // const sonosUrl = `https://api.sonos.com/login/v3/oauth?client_id=${SONOS_TOKEN}&response_type=code&state=${urlState}&scope=playback-control-all&redirect_uri=${redirectUri}`;
    const blocks = [
      {
        'type': 'section',
        'text': {
          'type': 'mrkdwn',
          'text': 'Create a new Sonos group',
        },
        'accessory': {
          'type': 'button',
          'text': {
            'type': 'plain_text',
            'text': '+ Create Group',
          },
          'style': 'primary',
          'value': 'click_me_123',
        },
      },
      {
        'type': 'section',
        'text': {
          'type': 'mrkdwn',
          'text': 'Edit Sonos speaker names',
        },
        'accessory': {
          'type': 'button',
          'text': {
            'type': 'plain_text',
            'text': 'Edit',
            'emoji': true,
          },
          'value': 'click_me_123',
        },
      },
      {
        'type': 'section',
        'text': {
          'type': 'mrkdwn',
          'text': 'To register speakers for your Household, you will need to use the Sonos App.',
        },
      },
      {
        'type': 'divider',
      },
      {
        'type': 'context',
        'elements': [
          {
            'type': 'mrkdwn',
            'text': '*:bust_in_silhouette: Un-Grouped Sonos Speakers*',
          },
        ],
      },
      {
        'type': 'divider',
      },
      {
        'type': 'context',
        'elements': [
          {
            'type': 'mrkdwn',
            'text': 'Dining Room, Living Room',
          },
        ],
      },
      {
        'type': 'divider',
      },
      {
        'type': 'context',
        'elements': [
          {
            'type': 'mrkdwn',
            'text': '*:busts_in_silhouette: Sonos Groups*',
          },
        ],
      },
      {
        'type': 'divider',
      },
      {
        'type': 'section',
        'text': {
          'type': 'mrkdwn',
          'text': '*Dining Room +1*',
        },
        'accessory': {
          'type': 'overflow',
          'options': [
            {
              'text': {
                'type': 'plain_text',
                'text': ':pencil2: Edit',
                'emoji': true,
              },
              'value': 'edit',
            },
            {
              'text': {
                'type': 'plain_text',
                'text': ':put_litter_in_its_place: Delete',
                'emoji': true,
              },
              'value': 'delete',
            },
          ],
        },
      },
      {
        'type': 'context',
        'elements': [
          {
            'type': 'mrkdwn',
            'text': ':loud_sound: *Speakers:* Bedroom 1, Dining Room 2, Master Bedroom, Another Speaker',
          },
        ],
      },
    ];
    // const blocks = [
    //   {
    //     'type': 'input',
    //     'label': {
    //       'type': 'plain_text',
    //       'text': 'Select speakers for the group',
    //       'emoji': true,
    //     },
    //     'hint': {
    //       'type': 'plain_text',
    //       'text': 'The first selected speaker will be the group coordinator.',
    //       'emoji': true,
    //     },
    //     'element': {
    //       'type': 'multi_static_select',
    //       'placeholder': {
    //         'type': 'plain_text',
    //         'text': 'Select speakers',
    //         'emoji': true,
    //       },
    //       'options': [
    //         {
    //           'text': {
    //             'type': 'plain_text',
    //             'text': ':pizza: Pizza',
    //             'emoji': true,
    //           },
    //           'value': 'value-0',
    //         },
    //         {
    //           'text': {
    //             'type': 'plain_text',
    //             'text': ':fried_shrimp: Thai food',
    //             'emoji': true,
    //           },
    //           'value': 'value-1',
    //         },
    //         {
    //           'text': {
    //             'type': 'plain_text',
    //             'text': ':desert_island: Hawaiian',
    //             'emoji': true,
    //           },
    //           'value': 'value-2',
    //         },
    //         {
    //           'text': {
    //             'type': 'plain_text',
    //             'text': ':meat_on_bone: Texas BBQ',
    //             'emoji': true,
    //           },
    //           'value': 'value-3',
    //         },
    //         {
    //           'text': {
    //             'type': 'plain_text',
    //             'text': ':hamburger: Burger',
    //             'emoji': true,
    //           },
    //           'value': 'value-4',
    //         },
    //         {
    //           'text': {
    //             'type': 'plain_text',
    //             'text': ':taco: Tacos',
    //             'emoji': true,
    //           },
    //           'value': 'value-5',
    //         },
    //         {
    //           'text': {
    //             'type': 'plain_text',
    //             'text': ':green_salad: Salad',
    //             'emoji': true,
    //           },
    //           'value': 'value-6',
    //         },
    //         {
    //           'text': {
    //             'type': 'plain_text',
    //             'text': ':stew: Indian',
    //             'emoji': true,
    //           },
    //           'value': 'value-7',
    //         },
    //       ],
    //     },
    //   },
    //   {
    //     'type': 'input',
    //     'element': {
    //       'type': 'static_select',
    //       'placeholder': {
    //         'type': 'plain_text',
    //         'text': 'Select an item',
    //         'emoji': true,
    //       },
    //       'options': [
    //         {
    //           'text': {
    //             'type': 'plain_text',
    //             'text': '*this is plain_text text*',
    //             'emoji': true,
    //           },
    //           'value': 'value-0',
    //         },
    //         {
    //           'text': {
    //             'type': 'plain_text',
    //             'text': '*this is plain_text text*',
    //             'emoji': true,
    //           },
    //           'value': 'value-1',
    //         },
    //         {
    //           'text': {
    //             'type': 'plain_text',
    //             'text': '*this is plain_text text*',
    //             'emoji': true,
    //           },
    //           'value': 'value-2',
    //         },
    //       ],
    //     },
    //     'label': {
    //       'type': 'plain_text',
    //       'text': 'Line-in source',
    //       'emoji': true,
    //     },
    //     'optional': true,
    //     'hint': {
    //       'type': 'plain_text',
    //       'text': 'This will set the speaker as the group coordinator.',
    //       'emoji': true,
    //     },
    //   },
    // ];
    const modal = slackModal(SONOS_MODAL, `Sonos Settings - Groups`, `Save`, `Cancel`, blocks, false, channelId);
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
