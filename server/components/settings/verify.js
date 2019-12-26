const config = require('config');
const { isPositiveInteger } = require('../../util/objects');
const { dialogError } = require('../slack/format/dialog');
const DB = config.get('dynamodb.settings');
const ERRORS = config.get('settings.errors');


function verifySettings(submission){
    let errors = [];
    for (let setting in submission){
        let value = submission[setting]
        switch(setting){
            case DB.disable_repeats_duration:
            case DB.skip_votes: 
            case DB.skip_votes_ah:
                if (!isPositiveInteger(value)){
                    errors.push(dialogError(setting, ERRORS.integer));
                }
                break;
        }
    }
    return errors;
}

module.exports = {
    verifySettings
}