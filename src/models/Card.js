class Card {
  /**
   * Creates a new Card instance.
   * @param {String} code - The code of the card.
   * @param {String} character - The character of the card.
   * @param {String} series - The series of the card.
   * @param {String} set - The set of the card.
   * @param {String} rarity - The rarity of the card.
   * @param {String} ownerId - The ID of the owner of the card.
   * @param {String} pulledId - The ID of the user who pulled the card.
   * @param {Number} modified - The Unix time the card was modified.
   * @param {Number} date - he Unix time the card was generated.
   * @param {String} guildId - The ID of the guild the card belongs to.
   * @param {String} generationType - The generation type of the card.
   * @param {String} tag - The tag of the card.
   * @param {String} emoji - The emoji associated with the card.
   * @param {String} image - The image of the card.
   * @param {String} sleeve - The sleeve of the card.
   * @param {String} frame - The frame of the card.
   */
  constructor(code, character, series, set, rarity, ownerId, pulledId, modified, date, guildId, generationType, tag, emoji, image, sleeve, frame) {
    this.code = code;
    this.character = character;
    this.series = series;
    this.set = set;
    this.rarity = rarity;
    this.ownerId = ownerId;
    this.pulledId = pulledId;
    this.modified = modified;
    this.date = date;
    this.guildId = guildId;
    this.generationType = generationType;
    this.tag = tag;
    this.emoji = emoji;
    this.image = image;
    this.sleeve = sleeve;
    this.frame = frame;
  }
}

module.exports = Card;
