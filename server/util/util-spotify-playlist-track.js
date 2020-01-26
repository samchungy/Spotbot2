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
    this.id = track.id;
    this.uri = track.uri;
    this.artists = track.artists.map((artist) => artist.name).join(', ');
    this.title = track.explicit ? `${this.artists} - ${this.name} (Explicit)` : `${this.artists} - ${this.name}`;
    this.addedAt = playlistTrackObject.added_at;
    this.addedBy = playlistTrackObject.added_by;
    this.is_playable = track.is_playable;
  }
}

module.exports = PlaylistTrack;
