const moment = require(process.env.MOMENT);
/**
 * Track Object
 */
class Track {
  /**
   * Creates a new Track Object
   * @param {Object} trackObject
   */
  constructor(trackObject) {
    const duration = moment.duration(trackObject.duration_ms);
    const seconds = duration.seconds().toString();
    this.name = trackObject.name;
    this.id = trackObject.id;
    this.uri = trackObject.uri;
    this.artists = trackObject.artists.map((artist) => artist.name).join(', ');
    this.artistsIds = trackObject.artists.map((artist) => artist.id);
    this.url = trackObject.external_urls.spotify;
    this.album = trackObject.album.name;
    // Get second highest res picture
    this.art = trackObject.album.images.length > 0 ? (trackObject.album.images.length > 1 ? trackObject.album.images[1].url : trackObject.album.images[0].url) : null;
    this.title = trackObject.explicit ? `${this.artists} - ${this.name} (Explicit)` : `${this.artists} - ${this.name}`;
    this.duration = `${duration.minutes()}:${seconds.length > 1 ? seconds : seconds.padStart(2, '0')}`;
  }
}

module.exports = Track;
