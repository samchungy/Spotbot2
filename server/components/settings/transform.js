const config = require('config');
const { playlistValue } = require('./playlists');
const { deviceValue } = require('./devices');
const SETTINGS = config.get('dynamodb.settings');

async function transformValue(attribute, newValue, oldValue){
    switch(attribute){
        case SETTINGS.playlist:
            newValue = await playlistValue(newValue);
            break;
        case SETTINGS.default_device:
            newValue = await deviceValue(newValue, oldValue);
            break;
    }
    return newValue;
}

module.exports = {
    transformValue
}