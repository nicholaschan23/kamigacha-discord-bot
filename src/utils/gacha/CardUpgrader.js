const config = require("../../config");
const crypto = require("crypto");
const CodeGenerator = require("./CodeGenerator");
const CardModel = require("../../database/mongodb/models/card/card");
const CollectionModel = require("../../database/mongodb/models/card/user/collection");

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
    const cards = await CardModel(this.client).find({
      code: { $in: cardCodes },
      ownerId: this.userId,
    });
    if (cards.length !== 10) {
      throw new Error("You no longer own all 10 specified cards. Make sure they stay in your collection during the upgrade process.");
    }

    // Remove card references from the user's collection
    const cardObjectIds = this.queriedCards.map((card) => card._id);
    await CollectionModel(this.client).updateOne({ userId: this.userId }, { $pull: { cardsOwned: { $in: cardObjectIds } } });

    // Delete the cards from existence
    await CardModel(this.client).deleteMany({ code: { $in: cardCodes } });

    // Determine success of upgrade
    if (!this.getSuccess) {
      return false;
    }

    // Implement your logic to determine the new card to create
    const cardData = await this.generateUpgradedCard();

    // Create the new card
    const cardInstance = new (CardModel(this.client))(cardData);
    const createdCard = await CardModel(this.client).create(cardInstance);

    // Add the new card to the user's collection
    await CollectionModel(this.client).updateOne({ userId: this.userId }, { $addToSet: { cardsOwned: createdCard._id } });
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

    const cg = new CodeGenerator(this.client);
    const code = await cg.getNewCode();

    const card = {
      code: code,
      series: series,
      set: set,
      rarity: rarity,
      character: character,
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
