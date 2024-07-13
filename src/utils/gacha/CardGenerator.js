const crypto = require("crypto");
const config = require("../../config");
const CodeGenerator = require("./CodeGenerator");
const CardModel = require("../../database/mongodb/models/card/card");
const CollectionModel = require("../../database/mongodb/models/card/collection");
const PityModel = require("../../database/mongodb/models/user/pity");
const StatsModel = require("../../database/mongodb/models/user/stats");

class CardGenerator {
  constructor(client, userId, guildId, rates) {
    this.client = client;
    this.userId = userId;
    this.guildId = guildId;
    this.rates = rates;
    this.cg = new CodeGenerator(client);

    // Information to save to database
    this.pity = { UR: 0, SR: 0, SSR: 0 };
    this.pullRarities = { C: 0, R: 0, UR: 0, SR: 0, SSR: 0 };
    this.cardData = [];
  }

  async cardPull(numPulls) {
    const jsonCards = this.client.jsonCards;
    const seriesKeys = this.client.jsonCardsKeys;
    await this.fetchPity();

    for (let i = 0; i < numPulls; i++) {
      // Select a rarity
      const rarity = this.getRarity();

      // Select a series and set
      const { series, set } = this.selectSeriesAndSet(rarity, jsonCards, seriesKeys);

      // Select a random character
      const characters = jsonCards[series][set][rarity];
      const character = characters[crypto.randomInt(0, characters.length)];

      // Generate card code
      const code = await this.cg.getNewCode();

      // Create card data
      const card = {
        code: code,
        series: series,
        set: set,
        rarity: rarity,
        character: character,
        ownerId: this.userId,
        pulledId: this.userId,
        guildId: this.guildId,
        generationType: numPulls > 1 ? "Multi-Pull" : "Pull",
        image: [process.env.CLOUDFRONT_URL, "cards", series, set, rarity, character].join("/"),
        emoji: "▪️",
      };
      this.cardData.push(card);

      // Update pull rarities
      this.pullRarities[rarity]++;

      // Update pity
      this.updatePity(rarity);
    }
    await this.saveChanges();
  }

  async fetchPity() {
    const userDocument = await PityModel(this.client).findOne({ userId: this.userId });
    if (userDocument) {
      this.pity.UR = userDocument.UR;
      this.pity.SR = userDocument.SR;
      this.pity.SSR = userDocument.SSR;
    }
  }

  selectSeriesAndSet(rarity, jsonCards, seriesKeys) {
    let series, set;

    if (rarity !== "C") {
      // Initialize arrays to hold series and set keys that match the rarity
      const matchingSeriesSets = [];

      // Traverse through series and sets to find matches
      seriesKeys.forEach((series) => {
        Object.keys(jsonCards[series]).forEach((setKey) => {
          if (jsonCards[series][setKey][rarity]) {
            matchingSeriesSets.push({ series: series, set: setKey });
          }
        });
      });

      // Select a random series from the matching list
      const selectedEntry = matchingSeriesSets[crypto.randomInt(0, matchingSeriesSets.length)];
      series = selectedEntry.series;

      // Filter matchingSeriesSets to get all sets for the selected series
      const matchingSetsForSeries = matchingSeriesSets.filter((entry) => entry.series === series).map((entry) => entry.set);

      // Select a set by weight from the filtered set keys
      set = this.getSet(matchingSetsForSeries);
    } else {
      // Select a random series
      series = seriesKeys[crypto.randomInt(0, seriesKeys.length)];

      // Select a random set
      set = this.getSet(Object.keys(jsonCards[series]));
    }

    return { series, set };
  }

  // Function to get a random index with increasing probability (1-indexed)
  getSet(setKeys) {
    if (setKeys.length > 1) {
      // Convert array to numbers
      const numSetKeys = setKeys.map((set) => parseInt(set));

      // Calculate the total weight sum
      const totalWeight = numSetKeys.reduce((a, b) => a + b, 0);

      // Generate a random number between 0 and total weight
      const randomValue = crypto.randomInt(0, totalWeight);

      // Find the index corresponding to the random value (1-indexed)
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

  getRarity() {
    // Check if pity is triggered
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

    // Random pull
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

  updatePity(rarity) {
    switch (rarity) {
      // UR is pulled, UR counter resets
      case "UR": {
        this.pity.UR = 0;
        break;
      }
      // SR is pulled, UR and SR counter resets
      case "SR": {
        this.pity.UR = 0;
        this.pity.SR = 0;
        break;
      }
      // SSR is pulled, all counters reset
      case "SSR": {
        this.pity.UR = 0;
        this.pity.SR = 0;
        this.pity.SSR = 0;
        break;
      }
      default: {
        this.pity.UR++;
        this.pity.SR++;
        this.pity.SSR++;
      }
    }
  }

  async saveChanges() {
    // Save pity timers
    await PityModel(this.client).findOneAndUpdate(
      { userId: this.userId }, // Filter
      {
        UR: this.pity.UR,
        SR: this.pity.SR,
        SSR: this.pity.SSR,
      },
      { upsert: true }
    );

    // Update stats
    await StatsModel(this.client).findOneAndUpdate(
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
      { upsert: true }
    );

    // Add card models to database
    const cards = this.cardData.map((data) => new (CardModel(this.client))(data));
    const savedCards = await CardModel(this.client).insertMany(cards);

    // Add cards to user's collection
    const cardObjectIds = savedCards.map((card) => card._id);
    await CollectionModel(this.client).findOneAndUpdate(
      { userId: this.userId }, // Filter
      { $addToSet: { cardsOwned: { $each: cardObjectIds } } },
      { upsert: true }
    );
  }
}

module.exports = CardGenerator;
