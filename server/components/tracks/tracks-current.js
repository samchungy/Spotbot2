const logger = require('../../util/util-logger');
const config = require('config');
const {fetchCurrentPlayback} = require('../spotify-api/spotify-api-playback-status');
const {fetchTracks, fetchPlaylistTotal} = require('../spotify-api/spotify-api-playlists');
const {loadBackToPlaylist, loadPlaylistSetting} = require('../settings/settings-dal');
const {contextSection, textSection} = require('../slack/format/slack-format-blocks');
const {inChannelPost} = require('../slack/format/slack-format-reply');
const {post} = require('../slack/slack-api');
const Track = require('../../util/util-spotify-track');
const PlaylistTrack = require('../../util/util-spotify-playlist-track');
const PLAY_RESPONSES = config.get('slack.responses.playback.play');
const LIMIT = config.get('spotify_api.playlists.tracks.limit');
const currentlyPlayingText = (title) => `:sound: Currently playing ${title}.`;
const contextOn = (playlist, position, total) => `:information_source: Playing from the Spotbot playlist: ${playlist}. ${position ? `Track ${position} of ${total}.`: ``}`;
const contextOff = (playlist, back) => `:information_source: Not playing from the Spotbot playlist: ${playlist}. ${back ? ` Spotbot will return when you add songs to the playlist.`: ``}`;

/**
 * Get Current Info
 * @param {string} teamId
 * @param {string} channelId
 */
async function getCurrentInfo(teamId, channelId) {
  try {
    let text;
    const blocks = [];
    const status = await fetchCurrentPlayback(teamId, channelId);
    if (status.item && status.is_playing) {
      const playlist = await loadPlaylistSetting(teamId, channelId);
      const track = new Track(status.item);
      text = currentlyPlayingText(track.title);
      blocks.push(textSection(text));
      if (status.context && status.context.uri.includes(playlist.id)) {
        // Find position in playlist
        const {positions, total} = await getTrackPositions(teamId, channelId, playlist.id, track.uri);
        if (positions.length == 1) {
          blocks.push(contextSection(null, contextOn(`<${playlist.url}|${playlist.name}>`, positions[0]+1, total)));
        } else if (positions.length== 0) {
          blocks.push(contextSection(null, `:information_source: Spotbot is returning to the Spotbot playlist: <${playlist.url}|${playlist.name}>. The next song will be back on the playlist.`));
        } else {
          blocks.push(contextSection(null, contextOn(`<${playlist.url}|${playlist.name}>`)));
        }
      } else {
        const backToPlaylist = await loadBackToPlaylist(teamId, channelId);
        blocks.push(contextSection(null, contextOff(`<${playlist.url}|${playlist.name}>`, backToPlaylist === 'true')));
      }
    } else {
      text = PLAY_RESPONSES.not_playing + ` Use \`/control\` to play Spotbot.`;
    }
    await post(
        inChannelPost(channelId, text, blocks.length ? blocks : null),
    );
  } catch (error) {
    logger.error(error);
  }
};

/**
 * Get Track Positions
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} playlistId
 * @param {string} trackUri
 */
async function getTrackPositions(teamId, channelId, playlistId, trackUri) {
  try {
    const {tracks: {total}} = await fetchPlaylistTotal(teamId, channelId, playlistId);
    const promises = [];
    const attempts = Math.ceil(total/LIMIT);
    for (let offset=0; offset<attempts; offset++) {
      promises.push(new Promise(async (resolve) =>{
        const spotifyTracks = await fetchTracks(teamId, channelId, playlistId, null, offset*LIMIT);
        const positions = [];
        spotifyTracks.items
            .map((track) => new PlaylistTrack(track))
            .forEach((track, index) => {
              if (track.uri === trackUri) {
                positions.push(index+(LIMIT*offset));
              }
            });
        resolve(positions);
      }));
    }
    const allTracksPromises = await Promise.all(promises);
    const allPositions = allTracksPromises.flat();
    return {positions: allPositions, total};
  } catch (error) {
    logger.error('Get Track positions failed');
    throw error;
  }
}

module.exports = {
  getCurrentInfo,
};
