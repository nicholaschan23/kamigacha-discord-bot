const Logger = require("../../../utils/Logger");
const logger = new Logger("Character DB");
const CharacterModel = require("../models/global/character");

/**
 * Adds characters associated with new cards.
 * Initializes character wishlist and circulation for card versions.
 * @param {Client} client
 * @param {Parsed JSON} characterModel
 * @param {Array<String>} characterKeys
 */
async function initCharacterDB(client) {
  const characterModel = client.jsonCharacters;
  const characterKeys = client.jsonCharacterKeys;

  // for (const character of characterKeys) {
  //   // Get series name
  //   const series = Object.keys(characterModel[character])[0];

  //   // Get array of sets
  //   const setsArr = Object.keys(characterModel[character][series]);

  //   const imageUrls = [];
  //   for (const set in setsArr) {
  //     for (const rarity in characterModel[character][series][set]) {
  //       imageUrls.push([character, series, set, `${rarity.toLowerCase()}.jpg`].join("-"));
  //     }
  //   }

  //   await upsertCharacter(client, { character: character, series: series }, imageUrls)
  // }

  const total = await CharacterModel().countDocuments({});
  logger.info(`${total} characters in database`);
  logger.info(`${characterKeys.length} characters parsed`);
  if (total === characterKeys.length) {
    logger.info("No new characters to initialize");
    return;
  }

  logger.info("Initializing characters...");
  let totalCards = 0;

  const promises = characterKeys.map(async (character) => {
    // Get series name
    const series = Object.keys(characterModel[character])[0];

    // Get array of sets
    const setsArr = Object.keys(characterModel[character][series]);

    const imageKeys = [];
    for (const set of setsArr) {
      for (const rarity of characterModel[character][series][set]) {
        imageKeys.push([character, series, set, `${rarity.toLowerCase()}`].join("-"));
      }
    }
    totalCards += imageKeys.length;

    return upsertCharacter(client, { character: character, series: series }, imageKeys);
  });

  await Promise.all(promises);
  logger.success(`${characterKeys.length} characters and ${totalCards.toLocaleString()} total cards have been initialized`);
}

/**
 * Helper function to update Character Models in MongoDB using Mongoose
 * @param {Client} client
 * @param {Object} query
 * @param {Array<String>} keys
 * @returns
 */
async function upsertCharacter(client, query, imageKeys) {
  // Convert imageUrls to a Map with default values
  const circulationData = {};
  imageKeys.forEach((url) => {
    circulationData[url] = { destroyed: 0, generated: 0 };
  });

  // const circulationData = {};
  // imageUrls.map((url) => { destroyed: 0, generated: 0 });
  // //   circulationData[url] = { destroyed: 0, generated: 0 };
  // // });

  const update = {
    $setOnInsert: {
      ...query,
      circulation: circulationData,
    },
  };

  const options = { new: true, upsert: true };

  const character = await CharacterModel().findOneAndUpdate(query, update, options);

  if (character) {
    let modified = false;
    for (const key of Object.entries(imageKeys)) {
      if (!character.circulation.has(key)) {
        character.circulation[key] = { destroyed: 0, generated: 0 };
        modified = true;
      }
    }

    if (modified) {
      await character.save();
    }

    return character;
  }
  return null;
}

module.exports = { initCharacterDB };
