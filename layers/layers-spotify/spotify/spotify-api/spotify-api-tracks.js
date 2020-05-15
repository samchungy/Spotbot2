const spotifyWebApi = require('./spotify-api-client');
const requester = require('./spotify-api-requester');

/**
 * Fetches track info from Spotfiy
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {string} market
 * @param {string} trackId
 */
const fetchTrackInfo = async (teamId, channelId, auth, market, trackId) => {
  return await requester(teamId, channelId, auth, `Get Track Info`, async () => {
    const spotifyApi = await spotifyWebApi(teamId, channelId, auth );
    return spotifyApi.getTrack(trackId, {market: market})
        .then((data)=>data.body);
  });
};

/**
 * Fetches track info from Spotfiy
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {string} market
 * @param {Array} trackIds
 */
const fetchTracksInfo = async (teamId, channelId, auth, market, trackIds) => {
  return await requester(teamId, channelId, auth, `Get Track Info`, async () => {
    const spotifyApi = await spotifyWebApi(teamId, channelId, auth );
    return spotifyApi.getTracks(trackIds, {market: market})
        .then((data)=>data.body);
  });
};

/**
 * Fetches artist tracks from Spotfiy
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {string} market
 * @param {string} artistId
 */
const fetchArtistTracks = async (teamId, channelId, auth, market, artistId) => {
  return await requester(teamId, channelId, auth, `Get Artist Tracks`, async () => {
    const spotifyApi = await spotifyWebApi(teamId, channelId, auth );
    return spotifyApi.getArtistTopTracks(artistId, market)
        .then((data)=>data.body);
  });
};


module.exports = {
  fetchArtistTracks,
  fetchTrackInfo,
  fetchTracksInfo,
};
