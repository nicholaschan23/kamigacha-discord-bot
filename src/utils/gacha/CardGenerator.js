const crypto = require("crypto");
const config = require("@config");
const CardModel = require("@database/mongodb/models/card/card");
const CollectionModel = require("@database/mongodb/models/card/collection");
const PityModel = require("@database/mongodb/models/user/pity");
const StatsModel = require("@database/mongodb/models/user/stats");
const CharacterModel = require("@database/mongodb/models/global/character");
const MapCache = require("@database/redis/cache/map");
const { generateCode } = require("@utils/gacha/generateCode");

class CardGenerator {
  constructor(userId, guildId, rates) {
    this.userId = userId;
    this.guildId = guildId;
    this.rates = rates;

    // Information to save to database
    this.pity = { UR: 0, SR: 0, SSR: 0 };
    this.pullRarities = { C: 0, R: 0, UR: 0, SR: 0, SSR: 0 };
    this.cardData = [];
  }

  // Main function to handle card pulls
  async cardPull(numPulls) {
    await this.fetchPity();

    for (let i = 0; i < numPulls; i++) {
      const rarity = this.getRarity();
      const { series, set } = await this.selectSeriesAndSet(rarity);
      const characterJpg = await this.selectCharacter(series, set, rarity);
      const character = characterJpg.split(`-${series}-`)[0];
      const code = await generateCode();

      const card = this.createCardData(code, character, series, set, rarity, characterJpg, numPulls);
      this.cardData.push(card);

      this.pullRarities[rarity]++;
      this.updatePity(rarity);
    }

    await this.saveChanges();
  }

  // Fetch pity values from the database
  async fetchPity() {
    const userDocument = await PityModel.findOne({ userId: this.userId });
    if (userDocument) {
      this.pity.UR = userDocument.UR;
      this.pity.SR = userDocument.SR;
      this.pity.SSR = userDocument.SSR;
    }
  }

  // Select a series and set based on rarity
  async selectSeriesAndSet(rarity) {
    const seriesKeys = await MapCache.getList("card-model-map");

    if (rarity !== "C") {
      const matchingSeriesSets = await this.getMatchingSeriesSets(seriesKeys, rarity);
      const selectedEntry = matchingSeriesSets[crypto.randomInt(0, matchingSeriesSets.length)];
      const series = selectedEntry.series;
      const matchingSetsForSeries = matchingSeriesSets.filter((entry) => entry.series === series).map((entry) => entry.set);
      const set = this.getSet(matchingSetsForSeries);
      return { series, set };
    } else {
      const series = seriesKeys[crypto.randomInt(0, seriesKeys.length)];
      const seriesModel = await MapCache.getMapEntry("card-model-map", series);
      const set = this.getSet(Object.keys(seriesModel));
      return { series, set };
    }
  }

  // Get matching series and sets for a given rarity
  async getMatchingSeriesSets(seriesKeys, rarity) {
    const matchingSeriesSets = [];
    for (const series of seriesKeys) {
      const seriesModel = await MapCache.getMapEntry("card-model-map", series);
      const matchingSets = Object.keys(seriesModel).filter((setKey) => seriesModel[setKey][rarity]);
      if (matchingSets.length > 0) {
        matchingSets.forEach((setKey) => matchingSeriesSets.push({ series: series, set: setKey }));
      }
    }
    return matchingSeriesSets;
  }

  // Select a random character from the series and set
  async selectCharacter(series, set, rarity) {
    const seriesModel = await MapCache.getMapEntry("card-model-map", series);
    const characters = seriesModel[set][rarity];
    return characters[crypto.randomInt(0, characters.length)];
  }

  // Create card data object
  createCardData(code, character, series, set, rarity, characterJpg, numPulls) {
    return {
      code: code,
      character: character,
      series: series,
      set: set,
      rarity: rarity,
      ownerId: this.userId,
      pulledId: this.userId,
      guildId: this.guildId,
      generationType: numPulls > 1 ? "Multi-Pull" : "Pull",
      image: [process.env.CLOUDFRONT_URL, "cards", series, set, rarity, characterJpg].join("/"),
      emoji: "▪️",
    };
  }

  // Function to get a random set with increasing probability for recent sets (1-indexed)
  getSet(setKeys) {
    if (setKeys.length > 1) {
      const numSetKeys = setKeys.map((set) => parseInt(set));
      const totalWeight = numSetKeys.reduce((a, b) => a + b, 0);
      const randomValue = crypto.randomInt(0, totalWeight);

      let cumulativeWeight = 0;
      for (let i = 0; i < setKeys.length; i++) {
        cumulativeWeight += numSetKeys[i];
        if (randomValue < cumulativeWeight) {
          return setKeys[i];
        }
      }
    }
    return setKeys[0];
  }

  // Determine the rarity of the card being pulled
  getRarity() {
    if (this.pity.UR > config.pity.UR) {
      this.pity.UR = 0;
      return "UR";
    }
    if (this.pity.SR > config.pity.SR) {
      this.pity.SR = 0;
      return "SR";
    }
    if (this.pity.SSR > config.pity.SSR) {
      this.pity.SSR = 0;
      return "SSR";
    }

    const randNum = crypto.randomInt(0, 100);
    let cumulativeChance = 0;
    for (const rate of this.rates) {
      cumulativeChance += rate.chance;
      if (randNum <= cumulativeChance) {
        return rate.rarity;
      }
    }
    return "C"; // Default to "Common" if no other rarity is selected
  }

  // Update pity counters based on the rarity pulled
  updatePity(rarity) {
    switch (rarity) {
      case "UR":
        this.pity.UR = 0;
        break;
      case "SR":
        this.pity.UR = 0;
        this.pity.SR = 0;
        break;
      case "SSR":
        this.pity.UR = 0;
        this.pity.SR = 0;
        this.pity.SSR = 0;
        break;
      default:
        this.pity.UR++;
        this.pity.SR++;
        this.pity.SSR++;
    }
  }

  // Save changes to the database
  async saveChanges() {
    const session = await CardModel.startSession();
    session.startTransaction();

    try {
      await this.savePity(session);
      await this.updateStats(session);
      const savedCards = await this.saveCards(session);
      await this.updateCollection(savedCards, session);
      await this.updateCharacterCirculation(session);

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Save pity values to the database
  async savePity(session) {
    await PityModel.findOneAndUpdate(
      { userId: this.userId },
      {
        UR: this.pity.UR,
        SR: this.pity.SR,
        SSR: this.pity.SSR,
      },
      { upsert: true, session: session }
    );
  }

  // Update user stats in the database
  async updateStats(session) {
    await StatsModel.findOneAndUpdate(
      { userId: this.userId },
      {
        $inc: {
          "totalCardsPulled.C": this.pullRarities["C"],
          "totalCardsPulled.R": this.pullRarities["R"],
          "totalCardsPulled.UR": this.pullRarities["UR"],
          "totalCardsPulled.SR": this.pullRarities["SR"],
          "totalCardsPulled.SSR": this.pullRarities["SSR"],
        },
      },
      { upsert: true, session: session }
    );
  }

  // Save card models to the database
  async saveCards(session) {
    const cards = this.cardData.map((data) => new CardModel(data));
    return await CardModel.insertMany(cards, { session: session });
  }

  // Update user's card collection in the database
  async updateCollection(savedCards, session) {
    const cardObjectIds = savedCards.map((card) => card._id);
    await CollectionModel.findOneAndUpdate(
      { userId: this.userId },
      { $addToSet: { cardsOwned: { $each: cardObjectIds } } },
      { upsert: true, session: session }
    );
  }

  // Update character card circulation in the database
  async updateCharacterCirculation(session) {
    const updateCirculation = this.cardData.map((card) => {
      return CharacterModel.updateOne(
        { character: card.character, series: card.series },
        { $inc: { [`circulation.${card.set}.rarities.${card.rarity}.generated`]: 1 } },
        { session: session }
      );
    });
    await Promise.all(updateCirculation);
  }
}

module.exports = CardGenerator;
