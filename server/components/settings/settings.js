const config = require('config');
const logger = require('../../util/logger');
// const { option, selectDialogElement, selectSlackDialogElement, selectDynamicSlackDialogElement, slackDialog, textDialogElement } = require('../slack/format/dialog');
const { option, slackModal, selectChannels, selectExternal, selectStatic, textInput } = require('../slack/format/modal');
const { getAllUserPlaylists, storeAllUserPlaylists } = require('./playlists');
const { getAllDevices } = require('./devices');
const { transformValue } = require('./transform');
const { sendModal, updateModal } = require('../slack/api');
const { getSettings, getView, updateSettings, storeView, viewModel } = require('./settingsDAL');
const { isEqual, isEmpty } = require('../../util/objects');
const { verifySettings } = require('./verify');
const { authBlock } = require('./spotifyAuth');

const HINTS = config.get('settings.hints');
const LABELS = config.get('settings.labels');
const QUERY = config.get('settings.query_lengths');
const LIMITS = config.get('settings.limits');
const PLACE = config.get('settings.placeholders');
const SETTINGS_MODAL = config.get('slack.actions.settings_modal');
const DB = config.get('dynamodb.settings');

async function openSettings(trigger_id){
    try {
        // //Do a load of User's Spotify Playlists and Devices
        // await storeAllUserPlaylists(settings.playlist);
        let blocks = []
        let { auth, auth_error } = await authBlock(trigger_id);
        console.log(auth_error);

        if(auth_error){
            blocks = [
                ...auth
            ]
        } else {
            blocks = [
                ...auth,
                ...await getBlocks()
            ]
        }

        let modal = slackModal(SETTINGS_MODAL, `Spotbot Settings`, `Save`, `Cancel`, blocks);
        await sendModal(trigger_id, modal);
        
        // let dialog = slackDialog(SETTINGS_DIALOG, `Spotbot Settings`, `Save`, elements);
        // await sendDialog(trigger_id, dialog);

    } catch (error) {
        logger.error(error);
    }


    //Slack Channel restriction


    //Slack API Call to open
}

async function getBlocks(){
    try {
        //Load OG Config
        let settings = await getSettings();
        return [
            selectChannels(DB.slack_channel, LABELS.slack_channel, HINTS.slack_channel, settings.slack_channel),
            selectExternal(DB.playlist, LABELS.playlist, HINTS.playlist, settings.playlist ? option(settings.playlist.name, settings.playlist.id) : null, QUERY.playlist),
            selectExternal(DB.default_device, LABELS.default_device, HINTS.default_device, settings.default_device ? option(settings.default_device.name, settings.default_device.id) : null, QUERY.default_device),
            textInput(DB.disable_repeats_duration, LABELS.disable_repeats_duration, HINTS.disable_repeats_duration, settings.disable_repeats_duration, LIMITS.disable_repeats_duration, PLACE.disable_repeats_duration),
            selectStatic(DB.back_to_playlist, LABELS.back_to_playlist, HINTS.back_to_playlist, settings.back_to_playlist ? yesOrNoToOption(settings.back_to_playlist) : null, yesOrNo()),
            textInput(DB.skip_votes, LABELS.skip_votes, HINTS.skip_votes_ah, settings.skip_votes, LIMITS.skip_votes, PLACE.skip_votes),
            textInput(DB.skip_votes_ah, LABELS.skip_votes_ah, HINTS.skip_votes_ah, settings.skip_votes_ah, LIMITS.skip_votes, PLACE.skip_votes_ah)
        ]
    } catch (error) {
        throw error;
    }
}

async function saveSettings(view, response_url){
    try {
        let submissions = extractSubmissions(view);
        let errors = verifySettings(submissions);
        if (!isEmpty(errors)){
            return { 
                response_action: "errors",
                errors: errors 
            }
        }
        let settings = await getSettings();
        for (let attribute in settings){
            let oldValue = settings[attribute];
            let newValue = submissions[attribute]
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

async function updateView(failReason){
    try {
        let view = await getView();
        let { auth, auth_error } = await authBlock(view.trigger_id, failReason);
        let blocks = [];
        if(auth_error){
            blocks = [
                ...auth
            ]
        } else {
            blocks = [
                ...auth,
                ...await getBlocks()
            ]
        }
        let modal = slackModal(SETTINGS_MODAL, `Spotbot Settings`, `Save`, `Cancel`, blocks);
        await updateModal(view.view_id, modal);
    } catch (error) {
        throw error;
    }
}

async function saveView(view, trigger_id){
    let store = viewModel(view.id, trigger_id)
    storeView(store);
}

function extractSubmissions(view){
    let values = view.state.values;
    let submissions = {};
    for (let setting in values){
        switch(setting){
            case DB.slack_channel:
                submissions[setting] = values[setting][setting].selected_channel
                break;
            case DB.playlist:
            case DB.default_device:
            case DB.back_to_playlist:
                submissions[setting] = values[setting][setting].selected_option.value
                break;
            case DB.disable_repeats_duration:
            case DB.skip_votes:
            case DB.skip_votes_ah:
                submissions[setting] = values[setting][setting].value
                break;
        }
    }
    return submissions;
}

function yesOrNo(){
    return [
        option(`Yes`, `true`),
        option(`No`, `false`)
    ]
}

function yesOrNoToOption(value){
    if (value == `true`){
        return option(`Yes`, `true`)
    } else {
        return option(`No`, `false`)
    }
}

module.exports = { getAllDevices, getAllUserPlaylists, openSettings, saveSettings, saveView, updateView }