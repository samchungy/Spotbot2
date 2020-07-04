/**
 * Track Object
 */
class TrackMin {
  /**
   * Creates a new Track Object
   * @param {Object} trackObject
   */
  constructor(trackObject) {
    const artists = trackObject.artists.map((artist) => artist.name).join(', ');
    const name = trackObject.name;
    this.id = trackObject.id;
    this.uri = trackObject.uri;
    this.title = trackObject.explicit ? `${artists} - ${name} (Explicit)` : `${artists} - ${name}`;
  }
}

module.exports = TrackMin;
