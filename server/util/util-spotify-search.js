/**
 * Track Object
 */
class Search {
  /**
   * Creates a new Track Object
   * @param {Object} items
   * @param {string} query
   */
  constructor(items, query) {
    this.numSearches = Math.ceil(items.length/3);
    this.currentSearch = 0;
    this.items = items;
    this.query = query;
  }
}

module.exports = Search;
