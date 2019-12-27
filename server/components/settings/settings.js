const config = require('config');
const logger = require('../../util/logger');
const { option, selectDialogElement, selectSlackDialogElement, selectDynamicSlackDialogElement, slackDialog, textDialogElement } = require('../slack/format/dialog');
const { getAllUserPlaylists, storeAllUserPlaylists } = require('./playlist');
const { getAllDevices, storeAllDevices } = require('./devices');
const { transformValue } = require('./transform');
const { sendDialog } = require('../slack/api');
const { getSettings, updateSettings } = require('./settingsDAL');
const { isEqual, isEmpty } = require('../../util/objects');
const { verifySettings } = require('./verify');

const HINTS = config.get('settings.hints');
const LABELS = config.get('settings.labels');
const PLACE = config.get('settings.placeholders');
const LIMITS = config.get('settings.limits');
const SETTINGS_DIALOG = config.get('slack.actions.settings_dialog');
const DB = config.get('dynamodb.settings');

async function openSettings(trigger_id){
    try {
        //Load OG Config
        let settings = await getSettings();

        //Do a load of User's Spotify Playlists and Devices
        await storeAllUserPlaylists(settings.playlist);
        await storeAllDevices(settings.default_device);

        let elements = [
            //Slack Channel Setting
            selectSlackDialogElement(DB.slack_channel, settings.slack_channel, LABELS.slack_channel, HINTS.slack_channel, `channels`, null),
            selectDynamicSlackDialogElement(DB.playlist, null, LABELS.playlist, HINTS.playlist, `external`, settings.playlist ? [option(settings.playlist.name, settings.playlist.id)] : null, 3),
            selectDialogElement(DB.default_device, settings.default_device ? settings.default_device.id : null, LABELS.default_device, HINTS.default_device, await getAllDevices()),
            textDialogElement(DB.disable_repeats_duration, settings.disable_repeats_duration, LABELS.disable_repeats_duration, HINTS.disable_repeats_duration, PLACE.disable_repeats_duration, LIMITS.disable_repeats_duration, `number`),
            selectDialogElement(DB.back_to_playlist, settings.back_to_playlist, LABELS.back_to_playlist, HINTS.back_to_playlist, yesOrNo()),
            textDialogElement(DB.skip_votes, settings.skip_votes, LABELS.skip_votes, HINTS.skip_votes, PLACE.skip_votes, LIMITS.skip_votes, `number`),
            textDialogElement(DB.skip_votes_ah, settings.skip_votes_ah, LABELS.skip_votes_ah, HINTS.skip_votes_ah, PLACE.skip_votes_ah, LIMITS.skip_votes, `number`)
        ]
        
        let dialog = slackDialog(SETTINGS_DIALOG, `Spotbot Settings`, `Save`, elements);
        await sendDialog(trigger_id, dialog);

    } catch (error) {
        logger.error(error);
    }


    //Slack Channel restriction


    //Slack API Call to open
}

async function saveSettings(submission, response_url){
    try {
        let response_url = payload.response_url;
        let errors = verifySettings(submission);
        if (errors.length > 0){
            return { errors: errors }
        }
        let settings = await getSettings();
        for (let attribute in settings){
            let oldValue = settings[attribute];
            let newValue = submission[attribute]
            newValue = await transformValue(attribute, newValue, oldValue);

            if (isEqual(oldValue, newValue)){
                //Save on unecessary Read/Writes
                delete settings[attribute];
            } else {
                settings[attribute] = newValue
            }
        }
        //TODO: Respond via response_url
        if (!isEmpty(settings)){
            await updateSettings(settings);
        }

    } catch (error) {
        logger.error(error);   
    }
}

function yesOrNo(){
    return [
        option(`Yes`, `true`),
        option(`No`, `false`)
    ]
}

module.exports = { getAllUserPlaylists, openSettings, saveSettings }