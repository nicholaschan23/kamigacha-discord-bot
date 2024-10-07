const config = require("@config");
const crypto = require("crypto");
const { generateCode } = require("@utils/gacha/generateCode");
const CardModel = require("@database/mongodb/models/card/card");
const CollectionModel = require("@database/mongodb/models/card/collection");
const CharacterModel = require("@database/mongodb/models/global/character");
const MapCache = require("@database/redis/cache/map");

class CardUpgrader {
  constructor(guildId, queriedCards, seriesSetFreq, rarityFreq) {
    this.userId = queriedCards[0].ownerId;
    this.guildId = guildId;
    this.queriedCards = queriedCards;
    this.queriedCodes = queriedCards.map((card) => card.code);
    this.seriesSetFreq = seriesSetFreq;
    this.rarityFreq = rarityFreq;
  }

  /**
   * Upgrades the specified cards.
   * @param {Array} cardCodes - The codes of the cards to upgrade.
   * @returns {Object} The data of the newly created upgraded card.
   */
  async cardUpgrade(cardCodes = this.queriedCodes) {
    // Re-verify ownership of cards
    const cards = await CardModel.find({ code: { $in: cardCodes }, ownerId: this.userId });
    if (cards.length !== 10) {
      throw new Error("You no longer own all 10 specified cards. Make sure they stay in your collection during the upgrade process.");
    }

    const cardDocumentIds = this.queriedCards.map((card) => card._id);

    // Create the new card
    const cardData = await this.generateUpgradedCard();
    const cardInstance = new CardModel(cardData);
    const createdCard = await CardModel.create(cardInstance);

    const session = await CardModel.startSession();
    session.startTransaction();

    try {
      // Remove card references from the user's collection
      await CollectionModel.updateOne({ userId: this.userId }, { $pull: { cardsOwned: { $in: cardDocumentIds } } }, { session: session });

      // Delete the cards from existence
      await CardModel.deleteMany({ code: { $in: cardCodes } }, { session: session });

      // Update character card destroyed stats
      await Promise.all(
        this.queriedCards.map(async (card) => {
          return CharacterModel.updateOne(
            { character: card.character, series: card.series }, // Query
            { $inc: { [`circulation.${card.set}.rarities.${card.rarity}.destroyed`]: 1 } }, // Increment the destroyed field
            { session: session }
          );
        })
      );

      // Add the new card to the user's collection
      await CollectionModel.updateOne({ userId: this.userId }, { $addToSet: { cardsOwned: createdCard._id } }, { session: session });

      // Update character card generated stats
      await CharacterModel.updateOne(
        { character: cardData.character, series: cardData.series }, // Query
        { $inc: { [`circulation.${cardData.set}.rarities.${cardData.rarity}.generated`]: 1 } }, // Increment the generated field
        { session: session }
      );

      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

    return cardData;
  }

  /**
   * Generates the data for an upgraded card.
   * @returns {Object} The data of the newly generated upgraded card.
   */
  async generateUpgradedCard() {
    // Select a series and set
    const [series, set] = this.getSeriesSet();

    // Select a rarity
    const rarity = this.getRarity();

    // Select a random character
    const seriesModel = await MapCache.getMapEntry("card-model-map", series);
    const characters = seriesModel[set][rarity];
    const character = characters[crypto.randomInt(0, characters.length)];

    const code = await generateCode();

    // Construct the card data
    const card = {
      code: code,
      series: series,
      set: set,
      rarity: rarity,
      character: character.split(`-${series}-`)[0],
      ownerId: this.userId,
      pulledId: this.userId,
      guildId: this.guildId,
      generationType: "Upgrade",
      image: [process.env.CLOUDFRONT_URL, "cards", series, set, rarity, character].join("/"),
      emoji: "▪️",
    };
    return card;
  }

  /**
   * Determines if the upgrade is successful based on rarity frequencies.
   * @param {Object} rarityFreq - The frequency of each rarity.
   * @returns {boolean} True if the upgrade is successful, false otherwise.
   */
  getSuccess(rarityFreq = this.rarityFreq) {
    // Calculate the cumulative fail chance based on rarity frequencies
    let failChance = 0;
    for (const rarity in rarityFreq) {
      const freq = rarityFreq[rarity];
      failChance += freq * config.upgradeFailRate[rarity];
    }

    // If fail chance is 0, always return true
    if (failChance === 0) {
      return true;
    }

    // Generate random number between 0 and 100
    const randNum = crypto.randomInt(0, 100);
    return randNum <= failChance;
  }

  /**
   * Selects a series and set based on their frequencies.
   * @param {Object} seriesSetFreq - The frequency of each series and set.
   * @returns {Array} The selected series and set.
   */
  getSeriesSet(seriesSetFreq = this.seriesSetFreq) {
    const randNum = crypto.randomInt(0, 10);
    let cumulativeChance = 0;
    for (const series in seriesSetFreq) {
      for (const set in seriesSetFreq[series]) {
        const freq = seriesSetFreq[series][set];
        cumulativeChance += freq;
        if (randNum <= cumulativeChance) {
          return [series, set];
        }
      }
    }
  }

  /**
   * Selects a rarity based on its frequency.
   * @param {Object} rarityFreq - The frequency of each rarity.
   * @returns {string} The selected rarity.
   */
  getRarity(rarityFreq = this.rarityFreq) {
    const randNum = crypto.randomInt(0, 10);
    let cumulativeChance = 0;
    for (const rarity in rarityFreq) {
      const freq = rarityFreq[rarity];
      cumulativeChance += freq;
      if (randNum <= cumulativeChance) {
        return config.getNextRarity(rarity);
      }
    }
  }
}

module.exports = CardUpgrader;
