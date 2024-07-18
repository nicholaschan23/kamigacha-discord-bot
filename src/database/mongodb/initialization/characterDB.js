const Logger = require("../../../utils/Logger");
const logger = new Logger("Character DB");
const CharacterModel = require("../models/global/character");

/**
 * Adds characters associated with new cards.
 * Initializes character wish count and circulation for card versions.
 *
 * @param {Object} client - The client object containing character data.
 * @param {Object} client.jsonCharacters - The character model containing card information.
 * @param {Array<String>} client.jsonCharacterKeys - The array of character keys.
 */
async function initCharacterDB(client) {
  const characterModel = client.jsonCharacters;
  const characterKeys = client.jsonCharacterKeys;

  // Count number of characters in database
  const totalDB = await CharacterModel().countDocuments({});
  logger.info(`${totalDB} characters in database`);

  // Count number of characters parsed in JSON
  let totalParsed = 0;
  for (const character of characterKeys) {
    totalParsed += Object.keys(characterModel[character]).length;
  }
  logger.info(`${totalParsed} characters parsed`);

  // No new characters to initialize
  if (totalDB === totalParsed) {
    logger.info("No new characters to initialize");
    return;
  }

  // Mismatched, add new characters to database
  logger.info("Initializing new characters...");
  let totalCharacters = 0;
  let totalCards = 0;
  const promises = [];

  for (const character of characterKeys) {
    // Get series names
    for (const series of Object.keys(characterModel[character])) {
      // Get array of sets
      const setsArr = Object.keys(characterModel[character][series]);

      const imageKeys = [];
      for (const set of setsArr) {
        for (const rarity of characterModel[character][series][set]) {
          imageKeys.push([character, series, set, `${rarity.toLowerCase()}`].join("-"));
        }
      }

      totalCharacters++;
      totalCards += imageKeys.length;

      // Push the promise to the array
      promises.push(upsertCharacter({ character: character, series: series }, imageKeys));
    }
  }

  await Promise.all(promises);
  logger.success(`${totalCharacters} characters and ${totalCards.toLocaleString()} total cards have been initialized`);
}

/**
 * Helper function to update Character Models in database.
 *
 * @param {Object} query - Character and series field.
 * @param {Array<String>} keys - Array of image ids in the format "character-series".
 */
async function upsertCharacter(query, imageKeys) {
  // Convert imageUrls to a Map with default values
  const circulationData = {};
  imageKeys.forEach((url) => {
    circulationData[url] = { destroyed: 0, generated: 0 };
  });

  const character = await CharacterModel().findOneAndUpdate(
    query, // Filter
    {
      $setOnInsert: {
        ...query,
        circulation: circulationData,
      },
    }, // Update
    { new: true, upsert: true } // Options
  );

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

    return true;
  }
  return null;
}

module.exports = { initCharacterDB };
