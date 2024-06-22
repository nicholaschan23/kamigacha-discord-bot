const CardModel = require("../../database/mongodb/models/card/card");
const CollectionModel = require("../../database/mongodb/models/card/collection");
const CodeGenerator = require("./CodeGenerator");
const crypto = require("crypto");
const config = require("../../config");
// const mongoose = require("mongoose")

class CardUpgrader {
  constructor(client, guildID, queriedCards, seriesSetFreq, rarityFreq) {
    this.client = client;
    this.userID = queriedCards[0].ownerID;
    this.guildID = guildID;
    this.queriedCards = queriedCards;
    this.queriedCodes = queriedCards.map((card) => card.code);
    this.seriesSetFreq = seriesSetFreq;
    this.rarityFreq = rarityFreq;
  }

  async cardUpgrade(cardCodes = this.queriedCodes) {
    // Re-verify ownership of cards
    const cards = await CardModel(this.client).find({
      code: { $in: cardCodes },
      ownerID: this.userID,
    });
    if (cards.length !== 10) {
      throw new Error("You no longer own all 10 specified cards. Make sure they stay in your collection during the upgrade process.");
    }

    // Remove card references from the user's collection
    const cardObjectIds = this.queriedCards.map(card => card._id);
    await CollectionModel(this.client).updateOne({ userID: this.userID }, { $pull: { cardsOwned: { $in: cardObjectIds } } });

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
    await CollectionModel(this.client).updateOne({ userID: this.userID }, { $addToSet: { cardsOwned: createdCard._id } });
    return cardData;
  }

  async generateUpgradedCard() {
    const [series, set] = this.getSeriesSet();
    const rarity = this.getRarity();

    const cardList = require("../../test/cardListSample");
    const characterIndex = crypto.randomInt(0, cardList[series][set][rarity].length);
    const characterArray = cardList[series][set][rarity];
    const character = characterArray[characterIndex];

    const cg = new CodeGenerator(this.client);
    const code = await cg.getNewCode();

    const card = {
      code: code,
      series: series,
      set: set,
      rarity: rarity,
      character: character,
      ownerID: this.userID,
      pulledID: this.userID,
      guildID: this.guildID,
      generationType: "Upgrade",
      image: "test",
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
