class CollectionTag {
  /**
   * Creates an instance of a Tag.
   * @param {string} tag - The name for this tag.
   * @param {string} emoji - The emoji for this tag.
   * @param {number} quantity - The number of cards associated with this tag.
   */
  constructor(tag, emoji, quantity) {
    this.tag = tag;
    this.emoji = emoji;
    this.quantity = quantity;
  }
}

module.exports = CollectionTag;
