class CollectionFilter {
  /**
   * Creates an instance of a Filter.
   * @param {string} emoji - The emoji for this filter.
   * @param {string} label - The name for this filter.
   * @param {string} filter - The filter string used to apply the filter.
   */
  constructor(emoji, label, filter) {
    this.emoji = emoji;
    this.label = label;
    this.filter = filter;
  }
}

module.exports = CollectionFilter;
