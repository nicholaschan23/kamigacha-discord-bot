const crypto = require("crypto");
const config = require("../../config");
const CodeGenerator = require("./CodeGenerator");
const PityModel = require("../../database/mongodb/models/user/pity");
const CardModel = require("../../database/mongodb/models/card/card");

class CardGenerator {
  constructor(client, userID, guildID) {
    this.client = client;
    this.userID = userID;
    this.userID = guildID;
    this.codeGenerator = new CodeGenerator(client);

    // Information to save to database
    this.pity = { UR: 0, SR: 0, SSR: 0 };
    this.pullRarities = { C: 0, R: 0, UR: 0, SR: 0, SSR: 0 };
    this.cardModels = [];

    this.init();
  }

  async init() {
    const userDocument = await PityModel(this.client).findOne({ userID: this.userID });
    if (!userDocument) return null;
    this.pity.UR = userDocument.pity.UR;
    this.pity.SR = userDocument.pity.SR;
    this.pity.SSR = userDocument.pity.SSR;
  }

  async cardPull(numPulls) {
    for (let i = 0; i < numPulls; i++) {
      // Determine rarity of the pull
      const rarity = this.getRarity();

      // TESTING
      // Function to select a random key from an object
      const getRandomKey = (obj) => {
        const keys = Object.keys(obj);
        const randomIndex = crypto.randomInt(0, keys.length);
        return keys[randomIndex];
      };

      // Select a random series
      const cardList = require("../../test/cardListSample");
      const randomSeries = getRandomKey(cardList);

      // Select a random edition from the random series
      const randomEdition = getRandomKey(cardList[randomSeries]);

      // Select a random rarity from the random edition
      // const randomRarity = getRandomKey(cardList[randomSeries][randomEdition]);

      // Select a random character from the random rarity
      const randomCharacterIndex = crypto.randomInt(0, cardList[randomSeries][randomEdition][rarity].length);
      const randomCharacter = cardList[randomSeries][randomEdition][rarity][randomCharacterIndex];

      this.cardModels.push(`Random series: ${randomSeries}\n` + `Random edition: ${randomEdition}\n` + `Random rarity: ${rarity}\n` + `Random character: ${randomCharacter}\n\n`);

      // Generate card code
      // const code = await this.codeGenerator.generateCode();

      // Create card model
      // const card = new (CardModel(this.client))({
      //   code: code,
      // });

      // Update pull rarities
      this.pullRarities[rarity]++;

      // Update pity
      // this.updatePity(rarity);
    }
    // await this.saveChanges();
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
    const randomBuffer = crypto.randomBytes(4);
    const randomNum = (randomBuffer.readUInt32LE() / 0xffffffff) * 100;
    let cumulativeChance = 0;

    for (const rarity of config.pullRate) {
      cumulativeChance += rarity.chance;
      if (randomNum <= cumulativeChance) {
        return rarity.rarity;
      }
    }
    return "C"; // Default to "Common" if no other rarity is selected
  }

  getSeries() {
    // Pick random series
    const seriesList = require("../../test/cardListSample");
    // Get the keys of the object
    const keys = Object.keys(seriesList);
    // Get the number of keys
    const numSeries = keys.length;
    // Generate a random index
    const randomIndex = crypto.randomInt(0, numSeries);
    // Get the random key
    const randomKey = keys[randomIndex];
    // Get the value of the random key
    return seriesList[randomKey];
  }

  getSet(series) {
    // Get the keys of the object
    const keys = Object.keys(series);
    // Get the number of keys
    const numSets = keys.length;
    // Generate a random index
    const randomIndex = crypto.randomInt(0, numSets);
    // Get the random key
    const randomKey = keys[randomIndex];
    // Get the value of the random key
    return series[randomKey];
  }

  getCharacter(set, rarity) {
    // Get the keys of the object
    const options = set[rarity];
    // Get the number of keys
    const numChars = options.length;
    // Generate a random index
    const randomIndex = crypto.randomInt(0, numChars);
    // Get the random key
    // Get the value of the random key
    return set[randomIndex];
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
    PityModel.findOneAndUpdate(
      { userID: this.userID }, // Filter
      { pity: this.pity } // Update
    );

    // Add cards to user's collection

    // Add card models to database
  }
}

module.exports = CardGenerator;
