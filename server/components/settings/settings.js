const config = require('config');
const logger = require('pino')();
const { getAllUserPlaylists, storeAllUserPlaylists } = require('./playlist');
const { sendDialog } = require('../slack/api');
const { getAllPlaylists } = require('../spotify-api/playlists');
const { getSettings, updateSettings } = require('./settingsDAL');
const HINTS = config.get('settings.hints');
const SETTINGS_DIALOG = config.get('slack.actions.settings_dialog');
const DB = config.get('dynamodb.settings');

async function openSettings(trigger_id){
    try {
        //Load OG Config
        let settings = await getSettings();

        //Do a load of User's Spotify Playlists and Devices
        await storeAllUserPlaylists(settings.playlist);

        //Sync Spotify Playlists
        //TODO - Get Spotify Playlists and upload to Dynamodb
        settings.default_device = settings.default_device ? selectDialogFormat(settings.default_device_name, `${settings.default_device}:${settings.default_device_name}`): null
        let elements = [
            //Slack Channel Setting
            selectSlackDialogElement(DB.slack_channel, settings.slack_channel, `Slack Channel Restriction`, HINTS.slack_channel, `channels`, null),
            selectDynamicSlackDialogElement(DB.playlist, null, `Spotbot Playlist`, HINTS.playlist, `external`, null, 3)
        ]
        
        let dialog = slackDialog(SETTINGS_DIALOG, `Spotbot Settings`, `Save`, elements);
        await sendDialog(trigger_id, dialog);

    } catch (error) {
        logger.error(error);
    }


    //Slack Channel restriction


    //Slack API Call to open
}

async function saveSettings(payload){
    try {
        console.log(payload.submission)
        let response_url = payload.response_url;
        await verifySettings(payload.submission);
        let settings = await getSettings();
        for (let attribute in settings){
            if (settings[attribute] == payload.submission[attribute]){
                //Save on unecessary Read/Writes
                delete settings[attribute];
            } else {
                settings[attribute] = payload.submission[attribute]
            }
        }
        //TODO: Respond via response_url
        await updateSettings(settings);

    } catch (error) {
        logger.error(error);   
    }
}

async function verifySettings(submission){
    
}

async function getAllUserPlaylists(){
    try {
        const limit = 50;
        let collaborativePlaylists = [];
        let i = 0;
        let playlists = await getAllPlaylists(i);
        while(true){


            //Only add if it is a collaborative playlist
            for (let playlist of playlists.body.items){
                if (playlist.collaborative == true){
                    collaborativePlaylists.push(playlist);
                }
            }

            //See if we can get more playlists as the Spotify Limit is 50 per call.
            if(playlist.body.total < i * limit){
                i++;
            } else {
                break;
            }
        }
        logger.info(collaborativePlaylists);

    } catch (error) {
        logger.error("Getting all Spotify Playlists failed");
        throw error;
    }
}

module.exports = { getAllUserPlaylists, openSettings, saveSettings }