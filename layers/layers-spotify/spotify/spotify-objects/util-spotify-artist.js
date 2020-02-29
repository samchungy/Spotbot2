/**
 * Artist Object
 */
class Artist {
  /**
   * Creates a new Artist Object
   * @param {Object} artistObject
   */
  constructor(artistObject) {
    const genre = artistObject.genres // Capitilises every genre word, places it in a string
        .map((genre) => genre.split(' ')
            .map((word) => (word[0].toUpperCase() + word.substr(1)))
            .join(' '))
        .join(', ');
    this.name = artistObject.name;
    this.id = artistObject.id;
    this.uri = artistObject.uri;
    this.art = artistObject.images.length > 0 ? (artistObject.images.length > 1 ? artistObject.images[1].url : artistObject.images[0].url) : null;
    this.genres = genre.length ? genre : 'Unknown';
    this.url = artistObject.external_urls.spotify;
    this.followers = artistObject.followers.total.toLocaleString('en-US');
  }
}

module.exports = Artist;
