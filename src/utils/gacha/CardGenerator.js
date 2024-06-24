const crypto = require("crypto");
const config = require("../../config");
const CodeGenerator = require("./CodeGenerator");
const CardModel = require("../../database/mongodb/models/card/card");
const CollectionModel = require("../../database/mongodb/models/card/collection");
const PityModel = require("../../database/mongodb/models/user/pity");
const StatsModel = require("../../database/mongodb/models/user/stats");

class CardGenerator {
  constructor(client, userID, guildID, rates) {
    this.client = client;
    this.userID = userID;
    this.guildID = guildID;
    this.rates = rates;
    this.cg = new CodeGenerator(client);

    // Information to save to database
    this.pity = { UR: 0, SR: 0, SSR: 0 };
    this.pullRarities = { C: 0, R: 0, UR: 0, SR: 0, SSR: 0 };
    this.cardData = [];
  }

  async cardPull(numPulls) {
    await this.fetchPity();
    const cardList = require("../../test/cardListSample");

    for (let i = 0; i < numPulls; i++) {
      // Function to select a random key from an object
      const getRandomKey = (obj) => {
        const keys = Object.keys(obj);
        const randomIndex = crypto.randomInt(0, keys.length);
        return keys[randomIndex];
      };

      // Select a random series
      const series = getRandomKey(cardList);
      // console.log(`Selected series: ${series}`);

      // Select a random edition from the random series
      const set = this.getSet(Object.keys(cardList[series]).length);
      // console.log(`Selected set: ${set}`);

      // Determine rarity of the pull
      const rarity = this.getRarity();
      // console.log(`Selected rarity: ${rarity}`);

      // Ensure that the selected series, set, and rarity exist in cardList
      // if (!cardList[series]) {
      //   console.error(`Series '${series}' not found in cardList`);
      //   continue;
      // }

      // if (!cardList[series][set]) {
      //   console.error(`Set '${set}' not found in series '${series}'`);
      //   continue;
      // }

      // if (!cardList[series][set][rarity]) {
      //   console.error(`Rarity '${rarity}' not found in set '${set}' of series '${series}'`);
      //   continue;
      // }

      // Select a random character from the random rarity
      const characterIndex = crypto.randomInt(0, cardList[series][set][rarity].length);
      // console.log(`Selected character index: ${characterIndex}`);

      // Ensure characterIndex is within the bounds
      const characterArray = cardList[series][set][rarity];
      // if (characterIndex < 0 || characterIndex >= characterArray.length) {
      //   console.error("Character index out of bounds");
      //   continue;
      // }

      const character = characterArray[characterIndex];
      // console.log(`Selected character: ${character}`);

      // Generate card code
      const code = await this.cg.getNewCode();

      // Create card data
      const card = {
        code: code,
        series: series,
        set: set,
        rarity: rarity,
        character: character,
        ownerID: this.userID,
        pulledID: this.userID,
        guildID: this.guildID,
        generationType: numPulls > 1 ? "Multi-Pull" : "Pull",
        image: "test",
        tag: ":black_small_square:",
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
    const userDocument = await PityModel(this.client).findOne({ userID: this.userID });
    if (userDocument) {
      this.pity.UR = userDocument.UR;
      this.pity.SR = userDocument.SR;
      this.pity.SSR = userDocument.SSR;
    }
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

  // Function to get a random index with increasing probability (1-indexed)
  getSet(length) {
    // Calculate the total weight sum (1 + 2 + ... + length)
    const totalWeight = (length * (length + 1)) / 2;

    // Generate a random number between 0 and total weight
    const randomValue = crypto.randomInt(0, totalWeight);

    // Find the index corresponding to the random value (1-indexed)
    let cumulativeWeight = 0;
    for (let i = 0; i < length; i++) {
      cumulativeWeight += i + 1;
      if (randomValue < cumulativeWeight) {
        return i + 1; // Return 1-indexed value
      }
    }
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
      { userID: this.userID }, // Filter
      {
        UR: this.pity.UR,
        SR: this.pity.SR,
        SSR: this.pity.SSR,
      },
      { upsert: true }
    );

    // Update stats
    await StatsModel(this.client).findOneAndUpdate(
      { userID: this.userID },
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
    const cardObjectIDs = savedCards.map((card) => card._id);
    await CollectionModel(this.client).findOneAndUpdate(
      { userID: this.userID }, // Filter
      { $addToSet: { cardsOwned: { $each: cardObjectIDs } } },
      { upsert: true }
    );
  }
}

module.exports = CardGenerator;
