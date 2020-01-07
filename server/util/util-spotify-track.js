/**
 * Track Object
 */
class Track {
  /**
   * Creates a new Track Object
   * @param {Object} trackObject
   */
  constructor(trackObject) {
    this.name = trackObject.explicit ? `${trackObject.name} (Explicit)` : trackObject.name;
    this.id = trackObject.id;
    this.artist = trackObject.artists[0].name;
    this.artists = trackObject.artists.map((artist) => artist.name).join(', ');
    this.url = trackObject.external_urls.spotify;
    this.album = trackObject.album.name;
    this.art = trackObject.album.images.length > 0 ? trackObject.album.images[0].url : '';
  }
}

module.exports = Track;
