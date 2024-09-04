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

  // Sum JSON characters stats (from S3 Bucket)
  let sumCharacterJson = 0;
  let sumCardJson = 0;
  for (const character of characterKeys) {
    sumCharacterJson += Object.keys(characterModel[character]).length;
    for (const series of Object.keys(characterModel[character])) {
      for (const set of Object.keys(characterModel[character][series])) {
        sumCardJson += Object.keys(characterModel[character][series][set]).length;
      }
    }
  }

  // Sum database character stats
  const sumCharacterDB = await sumCharactersDB();
  const sumCardDB = await sumCardsDB();

  logger.warn(`${sumCharacterDB}/${sumCharacterJson} characters in database`);
  logger.warn(`${sumCardDB}/${sumCardJson} cards in database`);

  // No new characters to initialize
  if (sumCharacterDB === sumCharacterJson && sumCardDB === sumCardJson) {
    logger.info("No new characters to initialize");
    return;
  }

  // Mismatched, add new characters to database
  logger.info("Initializing new characters...");
  let characterCount = 0;
  let cardCount = 0;
  const promises = [];

  for (const character of characterKeys) {
    // Get series names
    for (const series of Object.keys(characterModel[character])) {
      // Get array of sets
      const setsArr = Object.keys(characterModel[character][series]);

      for (const set of setsArr) {
        const rarities = [];
        for (const rarity of characterModel[character][series][set]) {
          rarities.push(rarity);
        }

        // Update total unique card arts
        cardCount += rarities.length;

        // Initialize the circulation stats for each set and rarity pair
        promises.push(upsertCharacter({ character: character, series: series }, set, rarities));
      }

      // All cards added for 1 character
      characterCount++;
    }
  }

  await Promise.all(promises);
  logger.success(`${characterCount.toLocaleString()} characters and ${cardCount.toLocaleString()} total cards have been initialized`);
}

// Count number of characters in database
async function sumCharactersDB() {
  const totalCharacters = await CharacterModel().countDocuments({});
  return totalCharacters;
}

// Count number of cards in database
async function sumCardsDB() {
  const characters = await CharacterModel().find({});
  let totalCards = 0;

  // Iterate through each character document
  characters.forEach((character) => {
    // Iterate through each set in the circulation array
    character.circulation.forEach((set) => {
      // Add the length of rarities map to the total
      totalCards += set.rarities.size;
    });
  });
  return totalCards;
}

/**
 * Helper function to update Character Models in database.
 *
 * @param {Object} query - Character and series field.
 * @param {Number} set - Set number the rarities are associated with.
 * @param {Array<String>} rarities - Array of rarities for a given set.
 */
async function upsertCharacter(query, set, rarities) {
  // Fetch character document
  const characterDocument = await CharacterModel().findOneAndUpdate(
    query, // Filter
    {
      $setOnInsert: {
        ...query,
      },
    }, // Update
    { new: true, upsert: true } // Options
  );

  // Ensure the circulation map has the necessary set
  if (!characterDocument.circulation.get(set)) {
    characterDocument.circulation.set(set, new Map());
  }
  
  // Initialize destroyed and generated counters
  let modified = false;
  const setMap = characterDocument.circulation.get(set);
  for (const rarity of rarities) {
    if (!setMap.rarities.get(rarity)) {
      setMap.rarities.set(rarity, { destroyed: 0, generated: 0 });
      modified = true;
    }
  }

  // Save modified document to database
  if (modified) {
    await characterDocument.save();
  }

  return true;
}

module.exports = { initCharacterDB };
