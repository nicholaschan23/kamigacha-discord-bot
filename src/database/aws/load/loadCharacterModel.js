const fsp = require("fs").promises;
const Logger = require("../../../utils/Logger");
const logger = new Logger("Character model");
const config = require("../../../config");
const { ensureDirExists } = require("../../../utils/fileSystem");

// Preprocess unique character names and the sets and rarities that exist for them
async function preprocessCharacterModel(cardsJson, seriesKeys) {
  const characterMap = {};

  // Process each series in parallel
  await Promise.all(
    seriesKeys.map(async (seriesName) => {
      const series = cardsJson[seriesName];

      // Iterate over each set in the series
      for (const setKey in series) {
        const set = series[setKey];

        // Iterate over each rarity in the set
        for (const rarityKey in set) {
          const rarity = set[rarityKey];

          // Iterate over each filename in the rarity array
          await Promise.all(
            rarity.map(async (filename) => {
              // Extract character name from filename
              const characterName = filename.split(`-${seriesName}-`)[0];

              // Update characterMap asynchronously
              if (!characterMap[characterName]) {
                characterMap[characterName] = {};
              }
              if (!characterMap[characterName][seriesName]) {
                characterMap[characterName][seriesName] = {};
              }
              if (!characterMap[characterName][seriesName][setKey]) {
                characterMap[characterName][seriesName][setKey] = [];
              }
              characterMap[characterName][seriesName][setKey].push(rarityKey);
            })
          );
        }
      }
    })
  );

  // Write data to file asynchronously
  try {
    await fsp.writeFile(config.CHARACTER_MODEL_PATH, JSON.stringify(characterMap, null, 2), { flag: "w" });
    logger.success(`Saved model: characters`);
  } catch (err) {
    logger.error("Error writing to file:" + err);
    throw err;
  }
}

async function loadCharacterModel(jsonCards, seriesKeys) {
  try {
    await fsp.access(config.CHARACTER_MODEL_PATH);
    logger.info(`Loaded model: characters`);
  } catch {
    await ensureDirExists(config.CHARACTER_MODEL_PATH);
    await preprocessCharacterModel(jsonCards, seriesKeys);
  }

  const data = await fsp.readFile(config.CHARACTER_MODEL_PATH, "utf8");
  const parsedJson = JSON.parse(data);
  const keys = Object.keys(parsedJson);
  return { object: parsedJson, keys: keys };
}

module.exports = { loadCharacterModel };
