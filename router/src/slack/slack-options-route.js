const config = require(process.env.CONFIG);
const SETTINGS = config.dynamodb.settings;

// const {checkSettings} = require('../server/components/settings/settings-middleware');
// const {getAllDevices, getAllPlaylists, getAllTimezones, saveSettings, updateView} = require('../server/components/settings/settings-controller');
// const {clearOneDay, jumpToStart, pause, play, reset, skip, toggleRepeat, toggleShuffle, verifyResetReview, voteToSkip} = require('../server/components/control/control-controller');
// const {getMoreArtists, getMoreTracks, cancelSearch, removeTracks, setTrack, viewArtist} = require('../server/components/tracks/tracks-controller');
// const {saveBlacklist} = require('../server/components/settings/blacklist/blacklist-controller');
// const {switchDevice} = require('../server/components/settings/device-select/device-controller');

module.exports = ( prefix, Router ) => {
  const router = new Router({
    prefix: prefix,
  });
  router
      .post('/', async (ctx, next) =>{
        if (ctx.request.body && ctx.request.body.payload) {
          // const payload = JSON.parse(ctx.request.body.payload);
          // let options;
          // switch (payload.action_id) {
          //   case SETTINGS.playlist:
          //     options = await getAllPlaylists(payload.team.id, payload.view.private_metadata, payload.value);
          //     ctx.body = options;
          //     break;
          //   case SETTINGS.default_device:
          //     options = await getAllDevices(payload.team.id, payload.view.private_metadata);
          //     ctx.body = options;
          //     break;
          //   case SETTINGS.timezone:
          //     options = await getAllTimezones(payload.value);
          //     ctx.body = options;
          //     break;
          // }
        }
      });

  return router;
};
