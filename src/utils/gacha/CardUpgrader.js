const config = require("../../config");
const crypto = require("crypto");
const {generateCode} = require("./generateCode");
const CardModel = require("../../database/mongodb/models/card/card");
const CollectionModel = require("../../database/mongodb/models/card/collection");
const CharacterModel = require("../../database/mongodb/models/global/character");

class CardUpgrader {
  constructor(client, guildId, queriedCards, seriesSetFreq, rarityFreq) {
    this.client = client;
    this.userId = queriedCards[0].ownerId;
    this.guildId = guildId;
    this.queriedCards = queriedCards;
    this.queriedCodes = queriedCards.map((card) => card.code);
    this.seriesSetFreq = seriesSetFreq;
    this.rarityFreq = rarityFreq;
  }

  async cardUpgrade(cardCodes = this.queriedCodes) {
    // Re-verify ownership of cards
    const cards = await CardModel().find({
      code: { $in: cardCodes },
      ownerId: this.userId,
    });
    if (cards.length !== 10) {
      throw new Error("You no longer own all 10 specified cards. Make sure they stay in your collection during the upgrade process.");
    }

    const cardDocumentIds = this.queriedCards.map((card) => card._id);

    // Create the new card
    const cardData = await this.generateUpgradedCard();
    const cardInstance = new (CardModel())(cardData);
    const createdCard = await CardModel().create(cardInstance);

    await Promise.all([
      // Remove card references from the user's collection
      CollectionModel().updateOne({ userId: this.userId }, { $pull: { cardsOwned: { $in: cardDocumentIds } } }),

      // Delete the cards from existence
      CardModel().deleteMany({ code: { $in: cardCodes } }),

      // Update character card destroyed stats
      ...this.queriedCards.map((card) => {
        return CharacterModel().updateOne(
          { character: card.character, series: card.series }, // Query
          { $inc: { [`circulation.${card.set}.rarities.${card.rarity}.destroyed`]: 1 } } // Increment the destroyed field
        );
      }),

      // Add the new card to the user's collection
      CollectionModel().updateOne({ userId: this.userId }, { $addToSet: { cardsOwned: createdCard._id } }),

      // Update character card generated stats
      CharacterModel().updateOne(
        { character: cardData.character, series: cardData.series }, // Query
        { $inc: { [`circulation.${cardData.set}.rarities.${cardData.rarity}.generated`]: 1 } } // Increment the generated field
      ),
    ]);

    // Determine success of upgrade
    // if (!this.getSuccess) {
    //   return false;
    // }

    return cardData;
  }

  async generateUpgradedCard() {
    const jsonCards = this.client.jsonCards;

    // Select a series and set
    const [series, set] = this.getSeriesSet();

    // Select a rarity
    const rarity = this.getRarity();

    // Select a random character
    const characters = jsonCards[series][set][rarity];
    const character = characters[crypto.randomInt(0, characters.length)];

    const code = await generateCode();

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

  getRarity(rarityFreq = this.rarityFreq) {
    const randNum = crypto.randomInt(0, 10);
    let cumulativeChance = 0;
    let failChance = 0;
    for (const rarity in rarityFreq) {
      const freq = rarityFreq[rarity];
      cumulativeChance += freq;
      failChance += freq * config.upgradeFailRate[rarity];
      if (randNum <= cumulativeChance) {
        return config.getNextRarity(rarity);
      }
    }
  }
}

module.exports = CardUpgrader;
