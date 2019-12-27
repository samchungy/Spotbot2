const config = require('config');
const logger = require('../../util/logger');
const { getPlaylistSetting, getPlaylists, playlistModel, storePlaylists } = require('./settingsDAL');
const { createPlaylist, getAllPlaylists } = require('../spotify-api/playlists');
const { getProfile } = require('./settingsDAL');
const { option, optionGroup } = require('../slack/format/dialog');
const { isEqual } = require('../../util/objects');

const SETTINGS_HELPER = config.get('dynamodb.settings_helper');
const LIMIT = config.get('spotify_api.playlists.limit');

async function getAllUserPlaylists(search){
    try {
        let searchPlaylists = []
        let playlists = await getPlaylists();
        for (let playlist of playlists){
            if (playlist.name.toLowerCase().includes(search.toLowerCase())){
                searchPlaylists.push(
                    option(playlist.name, playlist.id)
                );
            }
        }
        let current_playlist = await getPlaylistSetting();
        let other = []
        other.push(
            option(`${current_playlist.name} (Current Selection)`, `${current_playlist.id}`),
            option(`Create a new playlist called "${search}"`, `${SETTINGS_HELPER.create_new_playlist}${search}`)
        );

        if (searchPlaylists.length == 0){
            return {
                option_groups: [optionGroup(`No search results for "${search}"`, other)]
            }
        }
    
        return {
            option_groups: [
                optionGroup("Search Results:", searchPlaylists),
                optionGroup("Other:", other)
            ]
        }
    } catch (error) {
        logger.error("Getting all Spotify playlists failed");
        throw error;
    }
}

async function storeAllUserPlaylists(oldPlaylist){
    try {
        let compatiblePlaylists = [];
        if (oldPlaylist){
            compatiblePlaylists.push(oldPlaylist);
        }
        let i = 0;
        let playlists = await getAllPlaylists(i, LIMIT);
        let spotify_id = await getProfile();
        while(true){

            //Only add if it is a collaborative playlist
            for (let playlist of playlists.body.items){
                if (playlist.collaborative == true || playlist.owner.id == spotify_id){
                    let model = playlistModel(playlist.name, playlist.id, playlist.external_urls.spotify)
                    if (!isEqual(model, oldPlaylist)){
                        compatiblePlaylists.push(model);
                    }
                }
            }

            //See if we can get more playlists as the Spotify Limit is 50 per call.
            if(playlists.body.total > (i+1) * LIMIT){
                i++;
            } else {
                break;
            }
        }
        await storePlaylists(compatiblePlaylists);

    } catch (error) {
        logger.error("Storing all Spotify Playlists failed");
        throw error;
    }
}

async function playlistValue(newValue){
    try {
        if (newValue.includes(SETTINGS_HELPER.create_new_playlist)){
            newValue = newValue.replace(new RegExp(`^${SETTINGS_HELPER.create_new_playlist}`), "");
            //Create a new playlist using Spotify API
            let id = await getProfile();
            let newPlaylist = await createPlaylist(id, newValue);
            let newPlaylistModel = playlistModel(newValue, newPlaylist.body.id, newPlaylist.body.external_urls.spotify);
            return newPlaylistModel;
        } else {
            //Grab the playlist object from our earlier Database playlist fetch
            let playlists = await getPlaylists();
            for (let playlist of playlists){
                if (playlist.id === newValue){
                    return playlist;
                }
            }
        }
    } catch (error) {
        logger.error("Converting Playlist Value failed");
        throw error;
    }
}

module.exports = {
    getAllUserPlaylists,
    storeAllUserPlaylists,
    playlistValue
}