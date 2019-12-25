const config = require('config');
const logger = require('pino')()
const { spotifyWebApi } = require('./initialise');
const requester = require('./requester');
const SCOPES = config.get('spotify_api.scopes');

async function getAllPlaylists(offset){
    try {
        let spotifyApi = await spotifyWebApi();
        return await requester("Get All Playlists", () => spotifyApi.getUserPlaylists({limit: 50, offset: offset}));
    } catch (error) {
        throw error;
    }
}

module.exports = {
    getAllPlaylists
}