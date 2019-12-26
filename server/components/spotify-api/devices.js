const config = require('config');
const logger = require('pino')()
const { spotifyWebApi } = require('./initialise');
const requester = require('./requester');

async function getSpotifyDevices(){
    try {
        let spotifyApi = await spotifyWebApi();
        return await requester("Get Spotify Devices", () => spotifyApi.getMyDevices());
    } catch (error) {
        throw error;
    }
}

module.exports = {
    getSpotifyDevices
}