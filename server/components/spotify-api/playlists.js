const config = require('config');
const logger = require('../../util/logger');
const { spotifyWebApi } = require('./initialise');
const requester = require('./requester');
const COLLABORATIVE = config.get('spotify_api.playlists.collaborative');
const PUBLIC = config.get('spotify_api.playlists.public')

async function getAllPlaylists(offset, limit){
    try {
        let spotifyApi = await spotifyWebApi();
        return await requester("Get All Playlists", () => spotifyApi.getUserPlaylists({limit: limit, offset: offset}));
    } catch (error) {
        throw error;
    }
}

async function createPlaylist(id, name){
    try {
        let spotifyApi = await spotifyWebApi();
        return await requester("Create a new playlist", () => spotifyApi.createPlaylist(id, name, {collaborative: COLLABORATIVE, public: PUBLIC}));
    } catch (error) {
        throw error;
    }
}

module.exports = {
    createPlaylist,
    getAllPlaylists
}