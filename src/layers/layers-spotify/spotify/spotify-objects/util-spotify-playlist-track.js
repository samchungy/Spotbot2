/**
 * Playlist Track for Spotify
 */
class PlaylistTrack {
  /**
   * Creates a playlist track object
   * @param {Object} playlistTrackObject
   */
  constructor(playlistTrackObject) {
    const track = playlistTrackObject.track;
    this.name = track.name;
    this.id = (track.linked_from && track.linked_from.id) || track.id;
    this.uri = (track.linked_from && track.linked_from.uri) || track.uri;
    this.artists = track.artists.map((artist) => artist.name).join(', ');
    this.title = `${this.artists} - ${this.name}${track.explicit ? ' (Explicit)' : ''}`;
    this.addedAt = playlistTrackObject.added_at;
    this.addedBy = playlistTrackObject.added_by;
    this.is_playable = track.is_playable;
  }
}

module.exports = PlaylistTrack;
