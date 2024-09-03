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

  // Count number of characters and card images parsed in JSON
  let totalCharacters = 0;
  let totalCards = 0;
  for (const character of characterKeys) {
    totalCharacters += Object.keys(characterModel[character]).length;
    for (const series of Object.keys(characterModel[character])) {
      for (const set of Object.keys(characterModel[character][series])) {
        totalCards += Object.keys(characterModel[character][series][set]).length;
      }
    }
  }
  logger.info(`${totalCharacters} characters parsed`);
  logger.info(`${totalCards} cards parsed`);

  // No new characters to initialize
  if (await sumCharactersDB() === totalCharacters && await sumCardsDB() === totalCards) {
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
          rarities.push(`${rarity.toLowerCase()}`);
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
  console.log("chars", totalCharacters)
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
  console.log("cards", totalCards)
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
  // Convert imageUrls to a Map with default values
  // const circulationData = {};
  // rarities.forEach((rarity) => {
  //   circulationData[set][rarity] = { destroyed: 0, generated: 0 };
  // });

  const character = await CharacterModel().findOneAndUpdate(
    query, // Filter
    {
      $setOnInsert: {
        ...query,
      },
    }, // Update
    { new: true, upsert: true } // Options
  );

  // Ensure the circulation array has the necessary index
  if (character.circulation.length < set) {
    // Initialize missing indices with empty maps if they do not exist
    while (character.circulation.length < set) {
      character.circulation.push({ rarities: new Map() });
    }
  }

  let modified = false;
  for (const rarity of rarities) {
    if (!character.circulation[set - 1].rarities.get(rarity)) {
      character.circulation[set - 1].rarities.set(rarity, { destroyed: 0, generated: 0 });
      modified = true;
    }
  }

  if (modified) {
    await character.save();
  }

  return true;
}

module.exports = { initCharacterDB };
