const qs = require('querystring');
const sns = require('/opt/sns');
const lambda = require('/opt/lambda');
const logger = require('/opt/utils/util-logger');
const config = require('/opt/config/config');

// Slack
const {deleteReply} = require('/opt/slack/format/slack-format-reply');
const {reply} = require('/opt/slack/slack-api');
const {openModal, pushView} = require('/opt/router/slack-modal');
const slackAuthorized = require('/opt/router/authorizer');

// Settings
const {checkIsSetup} = require('/opt/router/check-settings');

// Util
const {isEmpty} = require('/opt/utils/util-objects');

// Errors
const {SetupError} = require('/opt/errors/errors-settings');

const SLACK_ACTIONS = config.slack.actions;
const AUTH = config.dynamodb.settings_auth;
const CONTROLS = SLACK_ACTIONS.controls;
const OVERFLOW = SLACK_ACTIONS.controller_overflow;
const TRACKS = SLACK_ACTIONS.tracks;
const ARTISTS = SLACK_ACTIONS.artists;

const SETTINGS_AUTH_CHANGE = process.env.SNS_PREFIX + 'settings-auth-change';
const SETTINGS_DEVICE_SWITCH = process.env.SNS_PREFIX + 'settings-device-switch';
const SETTINGS_SUBMIT_VERIFY = process.env.LAMBDA_PREFIX + 'settings-submit-verify';
const SETTINGS_BLACKLIST_SUBMIT_VERIFY = process.env.LAMBDA_PREFIX + 'settings-blacklist-submit-verify';
const SETTINGS_SONOS_GROUPS_OPEN = process.env.SNS_PREFIX + 'settings-sonos-groups-open';

const CONTROL_RESET_REVIEW_OPEN = process.env.SNS_PREFIX + 'control-reset-review-open';
const CONTROL_RESET_SET = process.env.SNS_PREFIX + 'control-reset-set';

const TRACKS_FIND_ADD = process.env.SNS_PREFIX + 'tracks-find-add';
const TRACKS_FIND_ARTISTS_GET_ARTISTS = process.env.SNS_PREFIX + 'tracks-find-artists-get-artists';
const TRACKS_FIND_ARTISTS_GET_TRACKS = process.env.SNS_PREFIX + 'tracks-find-artists-get-tracks';
const TRACKS_FIND_GET_TRACKS = process.env.SNS_PREFIX + 'tracks-find-get-tracks';
const TRACKS_REMOVE_SUBMIT = process.env.SNS_PREFIX + 'tracks-remove-submit';

const CONTROL_CLEAR_ONE = process.env.SNS_PREFIX + 'control-clear-one';
const CONTROL_JUMP = process.env.SNS_PREFIX + 'control-jump';
const CONTROL_PAUSE = process.env.SNS_PREFIX + 'control-pause';
const CONTROL_PLAY = process.env.SNS_PREFIX + 'control-play';
const CONTROL_SHUFFLE = process.env.SNS_PREFIX + 'control-shuffle';
const CONTROL_SKIP_START = process.env.SNS_PREFIX + 'control-skip-start';
const CONTROL_SKIP_ADD_VOTE = process.env.SNS_PREFIX + 'control-skip-add-vote';
const CONTROL_REPEAT = process.env.SNS_PREFIX + 'control-repeat';
const CONTROL_RESET_START = process.env.SNS_PREFIX + 'control-reset-start';
const CONTROL_RESET_REVIEW_SUBMIT = process.env.SNS_PREFIX + 'control-reset-review-submit';

const authRouter = async (actionId, payload, event) => {
  switch (actionId) {
    case AUTH.auth_url:
    case 'SONOS_AUTH':
      return;
    case AUTH.reauth: {
      const stage = `/${event.requestContext.stage}`;
      const url = `${event.headers['X-Forwarded-Proto']}://${event.headers.Host}${stage}`;
      const params = {
        Message: JSON.stringify({
          teamId: payload.team.id,
          channelId: payload.view.private_metadata,
          viewId: payload.view.id,
          userId: payload.user.id,
          url,
        }),
        TopicArn: SETTINGS_AUTH_CHANGE,
      };
      await sns.publish(params).promise();
      return;
    }
  }
  return false;
};

const settingsActionRouter = async (callbackId, payload) => {
  switch (callbackId) {
    case 'SONOS_GROUPS': {
      const modalPayload = await pushView(payload.team.id, payload.channel.id, payload.trigger_id, SLACK_ACTIONS.empty_modal, 'Sonos Settings - Groups', null, 'Cancel');
      const params = {
        Message: JSON.stringify({
          teamId: payload.team.id,
          channelId: payload.channel.id,
          settings: await checkIsSetup(payload.team.id, payload.channel.id),
          viewId: modalPayload.view.id,
          userId: payload.user.id,
        }),
        TopicArn: SETTINGS_SONOS_GROUPS_OPEN,
      };
      await sns.publish(params).promise();
      break;
    }
  }
  return false;
};

const settingsSubmitRouter = async (callbackId, payload) => {
  switch (callbackId) {
    case SLACK_ACTIONS.settings_modal: {
      const params = {
        FunctionName: SETTINGS_SUBMIT_VERIFY, // the lambda function we are going to invoke
        Payload: JSON.stringify({
          teamId: payload.team.id,
          channelId: payload.view.private_metadata,
          view: payload.view,
          userId: payload.user.id,
        }),
      };
      const {Payload} = await lambda.invoke(params).promise();
      const errors = Payload.length ? JSON.parse(Payload) : null;
      if (errors && !isEmpty(errors)) {
        return Payload;
      }
      return;
    }
    case SLACK_ACTIONS.blacklist_modal: {
      const params = {
        FunctionName: SETTINGS_BLACKLIST_SUBMIT_VERIFY,
        Payload: JSON.stringify({
          teamId: payload.team.id,
          channelId: payload.view.private_metadata,
          view: payload.view,
          userId: payload.user.id,
        }),
      };
      const {Payload} = await lambda.invoke(params).promise();
      const errors = Payload.length ? JSON.parse(Payload) : null;
      if (errors && !isEmpty(errors)) {
        return Payload;
      }
      return;
    }
    case SLACK_ACTIONS.device_modal: {
      const params = {
        Message: JSON.stringify({
          teamId: payload.team.id,
          channelId: payload.view.private_metadata,
          userId: payload.user.id,
          view: payload.view,
        }),
        TopicArn: SETTINGS_DEVICE_SWITCH,
      };
      await sns.publish(params).promise();
      return;
    }
  }
  return false;
};

const controlActionsRouter = async (actionId, payload) => {
  switch (actionId) {
    case CONTROLS.play: {
      const params = {
        Message: JSON.stringify({
          teamId: payload.team.id,
          channelId: payload.channel.id,
          settings: await checkIsSetup(payload.team.id, payload.channel.id),
          userId: payload.user.id,
        }),
        TopicArn: CONTROL_PLAY,
      };
      return await sns.publish(params).promise();
    }
    case CONTROLS.play_close: {
      const params = {
        Message: JSON.stringify({
          teamId: payload.team.id,
          channelId: payload.channel.id,
          settings: await checkIsSetup(payload.team.id, payload.channel.id),
          userId: payload.user.id,
          responseUrl: payload.response_url,
        }),
        TopicArn: CONTROL_PLAY,
      };
      return await sns.publish(params).promise();
    }
    case CONTROLS.play_track: {
      const params = {
        Message: JSON.stringify({
          teamId: payload.team.id,
          channelId: payload.channel.id,
          settings: await checkIsSetup(payload.team.id, payload.channel.id),
          userId: payload.user.id,
          responseUrl: payload.response_url,
          trackUri: payload.actions[0].value,
        }),
        TopicArn: CONTROL_PLAY,
      };
      return await sns.publish(params).promise();
    }
    case CONTROLS.pause: {
      const params = {
        Message: JSON.stringify({
          teamId: payload.team.id,
          channelId: payload.channel.id,
          settings: await checkIsSetup(payload.team.id, payload.channel.id),
          userId: payload.user.id,
        }),
        TopicArn: CONTROL_PAUSE,
      };
      return await sns.publish(params).promise();
    }
    case CONTROLS.skip: {
      const params = {
        Message: JSON.stringify({
          teamId: payload.team.id,
          channelId: payload.channel.id,
          settings: await checkIsSetup(payload.team.id, payload.channel.id),
          userId: payload.user.id,
        }),
        TopicArn: CONTROL_SKIP_START,
      };
      return await sns.publish(params).promise();
    }
    case CONTROLS.jump_to_start_close: {
      const params = {
        Message: JSON.stringify({
          teamId: payload.team.id,
          channelId: payload.channel.id,
          settings: await checkIsSetup(payload.team.id, payload.channel.id),
          userId: payload.user.id,
          responseUrl: payload.response_url,
        }),
        TopicArn: CONTROL_JUMP,
      };
      return await sns.publish(params).promise();
    }
    case SLACK_ACTIONS.skip_vote: {
      const params = {
        Message: JSON.stringify({
          teamId: payload.team.id,
          channelId: payload.channel.id,
          settings: await checkIsSetup(payload.team.id, payload.channel.id),
          userId: payload.user.id,
          responseUrl: payload.response_url,
        }),
        TopicArn: CONTROL_SKIP_ADD_VOTE,
      };
      return await sns.publish(params).promise();
    }
    case SLACK_ACTIONS.reset_review_confirm: {
      const modalPayload = await openModal(payload.team.id, payload.channel.id, payload.trigger_id, SLACK_ACTIONS.empty_modal, 'Reset - Tracks Review', null, 'Cancel');
      const params = {
        Message: JSON.stringify({
          teamId: payload.team.id,
          channelId: payload.channel.id,
          settings: await checkIsSetup(payload.team.id, payload.channel.id),
          viewId: modalPayload.view.id,
          responseUrl: payload.response_url,
        }),
        TopicArn: CONTROL_RESET_REVIEW_OPEN,
      };
      await sns.publish(params).promise();
      break;
    }
    case SLACK_ACTIONS.reset_review_deny: {
      const params = {
        Message: JSON.stringify({
          teamId: payload.team.id,
          channelId: payload.channel.id,
          settings: await checkIsSetup(payload.team.id, payload.channel.id),
          userId: payload.user.id,
          responseUrl: payload.response_url,
        }),
        TopicArn: CONTROL_RESET_SET,
      };
      await sns.publish(params).promise();
      break;
    }
    case OVERFLOW: {
      switch (payload.actions[0].selected_option.value) {
        case CONTROLS.jump_to_start: {
          const params = {
            Message: JSON.stringify({
              teamId: payload.team.id,
              channelId: payload.channel.id,
              settings: await checkIsSetup(payload.team.id, payload.channel.id),
              userId: payload.user.id,
            }),
            TopicArn: CONTROL_JUMP,
          };
          return await sns.publish(params).promise();
        }
        case CONTROLS.shuffle: {
          await checkIsSetup(payload.team.id, payload.channel.id);
          const params = {
            Message: JSON.stringify({
              teamId: payload.team.id,
              channelId: payload.channel.id,
              userId: payload.user.id,
            }),
            TopicArn: CONTROL_SHUFFLE,
          };
          return await sns.publish(params).promise();
        }
        case CONTROLS.repeat: {
          await checkIsSetup(payload.team.id, payload.channel.id);
          const params = {
            Message: JSON.stringify({
              teamId: payload.team.id,
              channelId: payload.channel.id,
              userId: payload.user.id,
            }),
            TopicArn: CONTROL_REPEAT,
          };
          return await sns.publish(params).promise();
        }
        case CONTROLS.reset: {
          const params = {
            Message: JSON.stringify({
              teamId: payload.team.id,
              channelId: payload.channel.id,
              settings: await checkIsSetup(payload.team.id, payload.channel.id),
              userId: payload.user.id,
            }),
            TopicArn: CONTROL_RESET_START,
          };
          return await sns.publish(params).promise();
        }
        case CONTROLS.clear_one: {
          const params = {
            Message: JSON.stringify({
              teamId: payload.team.id,
              channelId: payload.channel.id,
              settings: await checkIsSetup(payload.team.id, payload.channel.id),
              userId: payload.user.id,
            }),
            TopicArn: CONTROL_CLEAR_ONE,
          };
          return await sns.publish(params).promise();
        }
      }
    }
  }
  return false;
};

const controlSubmitRouter = async (callbackId, payload) => {
  switch (callbackId) {
    case SLACK_ACTIONS.reset_modal: {
      const params = {
        Message: JSON.stringify({
          teamId: payload.team.id,
          channelId: payload.view.private_metadata,
          settings: await checkIsSetup(payload.team.id, payload.view.private_metadata),
          view: payload.view,
          userId: payload.user.id,
        }),
        TopicArn: CONTROL_RESET_REVIEW_SUBMIT,
      };
      await sns.publish(params).promise();
      return;
    }
  }
  return false;
};

const controlCloseRouter = async (callbackId, payload) => {
  switch (callbackId) {
    case SLACK_ACTIONS.reset_modal: {
      const params = {
        Message: JSON.stringify({
          teamId: payload.team.id,
          channelId: payload.view.private_metadata,
          settings: await checkIsSetup(payload.team.id, payload.view.private_metadata),
          userId: payload.user.id,
        }),
        TopicArn: CONTROL_RESET_SET,
      };
      await sns.publish(params).promise();
      return;
    }
  }
  return false;
};

const tracksActionsRouter = async (actionId, payload) => {
  switch (actionId) {
    // TRACKS
    case TRACKS.cancel_search: { // Artist Search also uses this
      await reply(
          deleteReply('', null),
          payload.response_url,
      );
      return;
    }
    case TRACKS.see_more_results: {
      await checkIsSetup(payload.team.id, payload.channel.id);
      const params = {
        Message: JSON.stringify({
          teamId: payload.team.id,
          channelId: payload.channel.id,
          userId: payload.user.id,
          triggerId: payload.actions[0].value,
          responseUrl: payload.response_url,
        }),
        TopicArn: TRACKS_FIND_GET_TRACKS,
      };
      await sns.publish(params).promise();
      return;
    }
    case TRACKS.add_to_playlist: {
      const params = {
        Message: JSON.stringify({
          teamId: payload.team.id,
          channelId: payload.channel.id,
          settings: await checkIsSetup(payload.team.id, payload.channel.id),
          userId: payload.user.id,
          trackValue: payload.actions[0].value,
          responseUrl: payload.response_url,
        }),
        TopicArn: TRACKS_FIND_ADD,
      };
      await sns.publish(params).promise();
      return;
    }
    // ARTISTS
    case ARTISTS.view_artist_tracks: {
      await checkIsSetup(payload.team.id, payload.channel.id);
      const params = {
        Message: JSON.stringify({
          teamId: payload.team.id,
          channelId: payload.channel.id,
          userId: payload.user.id,
          artistId: payload.actions[0].value,
          triggerId: payload.trigger_id,
          responseUrl: payload.response_url,
        }),
        TopicArn: TRACKS_FIND_ARTISTS_GET_TRACKS,
      };
      await sns.publish(params).promise();
      return;
    }
    case ARTISTS.see_more_artists: {
      await checkIsSetup(payload.team.id, payload.channel.id);
      const params = {
        Message: JSON.stringify({
          teamId: payload.team.id,
          channelId: payload.channel.id,
          userId: payload.user.id,
          triggerId: payload.actions[0].value,
          responseUrl: payload.response_url,
        }),
        TopicArn: TRACKS_FIND_ARTISTS_GET_ARTISTS,
      };
      await sns.publish(params).promise();
      return;
    }
  }
  return false;
};

const tracksSubmitRouter = async (callbackId, payload) => {
  switch (callbackId) {
    case SLACK_ACTIONS.remove_modal: {
      const params = {
        Message: JSON.stringify({
          teamId: payload.team.id,
          channelId: payload.view.private_metadata,
          settings: await checkIsSetup(payload.team.id, payload.view.private_metadata),
          userId: payload.user.id,
          view: payload.view,
        }),
        TopicArn: TRACKS_REMOVE_SUBMIT,
      };
      await sns.publish(params).promise();
      return;
    }
  }
  return false;
};

const router = async (event, context) => {
  const eventPayload = qs.parse(event.body);
  if (eventPayload) {
    const payload = JSON.parse(eventPayload.payload);
    switch (payload.type) {
      case SLACK_ACTIONS.block_actions: {
        if (payload.actions.length > 0) {
          const actionId = payload.actions[0].action_id;
          const authRouterRun = await authRouter(actionId, payload, event);
          if (authRouterRun !== false) {
            return authRouterRun;
          }
          const tracksActionsRouterRun = await tracksActionsRouter(actionId, payload);
          if (tracksActionsRouterRun !== false) {
            return tracksActionsRouterRun;
          }
          const controlRouterRun = await controlActionsRouter(actionId, payload);
          if (controlRouterRun !== false) {
            return authRouterRun;
          }
          const settingsActionRouterRun = await settingsActionRouter(actionId, payload);
          if (settingsActionRouterRun !== false) {
            return settingsActionRouterRun;
          }
        }
        break;
      }
      case SLACK_ACTIONS.view_submission: {
        const settingsSubmitRouterRun = await settingsSubmitRouter(payload.view.callback_id, payload);
        if (settingsSubmitRouterRun !== false) {
          return settingsSubmitRouterRun;
        }
        const tracksSubmitRouterRun = await tracksSubmitRouter(payload.view.callback_id, payload);
        if (tracksSubmitRouterRun !== false) {
          return tracksSubmitRouterRun;
        }
        const controlSubmitRouterRun = await controlSubmitRouter(payload.view.callback_id, payload);
        if (controlSubmitRouterRun !== false) {
          return controlSubmitRouterRun;
        }
        break;
      }
      case SLACK_ACTIONS.view_closed: {
        const controlCloseRouterRun = await controlCloseRouter(payload.view.callback_id, payload);
        if (controlCloseRouterRun !== false) {
          return controlCloseRouterRun;
        }
      }
    }
  }
};

module.exports.handler = async (event, context) => {
  if (!slackAuthorized(event)) {
    return {statusCode: 401, body: 'Unauathorized'};
  }
  return await router(event, context)
      .then((data) => ({statusCode: 200, body: data ? data : ''}))
      .catch((error) => {
        if (error instanceof SetupError) {
          return {statusCode: 200, body: error.message};
        }
        logger.error(error, 'Uncategorized Error in Slack Actions Router');
      });
};
