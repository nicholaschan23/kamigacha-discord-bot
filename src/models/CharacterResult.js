class CharacterResult {
  /**
   * Creates an instance of a CharacterResult.
   * @param {String} character The character's name.
   * @param {String} series The character's series name.
   * @param {Number} wishCount The character's total wish count.
   * @param {Number} frequency How many times this result has appeared.
   */
  constructor(character, series, wishCount, frequency) {
    this.character = character;
    this.series = series;
    this.wishCount = wishCount;
    this.frequency = frequency;
  }
}

module.exports = CharacterResult;
