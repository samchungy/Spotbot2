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
    this.id = (trackObject.linked_from && trackObject.linked_from.id) || trackObject.id;
    this.uri = (trackObject.linked_from && trackObject.linked_from.uri) || trackObject.uri;
    this.title = `${artists} - ${name}${trackObject.explicit ? ' (Explicit)' : ''}`;
  }
}

module.exports = TrackMin;
