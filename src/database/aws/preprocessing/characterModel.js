const config = require("@config");
const { loadModel, saveModel } = require("@utils/fileSystem");

/**
 * Creates a character model from the given card model and series keys.
 *
 * @param {Object} cardModel - The card model containing series, sets, and rarities.
 * @param {Array<string>} seriesKeys - An array of series names to process.
 * @param {Object} [existingModel={}] - An optional existing character model to extend.
 * @returns {Promise<Object>} A promise that resolves to the created character model.
 */
async function createModel(cardModel, seriesKeys, existingModel = {}) {
  const characterModel = { ...existingModel };

  // Process each series in parallel
  await Promise.all(
    seriesKeys.map(async (seriesName) => {
      const series = cardModel[seriesName];

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

              // Ensure character exists
              if (!characterModel[characterName]) {
                characterModel[characterName] = {};
              }

              // Ensure series exists for the character
              if (!characterModel[characterName][seriesName]) {
                characterModel[characterName][seriesName] = {};
              }

              // Ensure set exists for the character in the series
              if (!characterModel[characterName][seriesName][setKey]) {
                characterModel[characterName][seriesName][setKey] = [];
              }

              // Append rarityKey if it doesn't already exist
              if (!characterModel[characterName][seriesName][setKey].includes(rarityKey)) {
                characterModel[characterName][seriesName][setKey].push(rarityKey);

                // Sort the array after inserting
                characterModel[characterName][seriesName][setKey].sort((a, b) => {
                  return config.getRarityRank(a) - config.getRarityRank(b);
                });
              }
            })
          );
        }
      }
    })
  );

  return characterModel;
}

async function initCharacterModel(cardModel, seriesKeys) {
  const filePath = config.CHARACTER_MODEL_PATH;

  // Create and save model
  const existingModel = await loadModel(filePath);
  const updatedModel = await createModel(cardModel, seriesKeys, existingModel);
  await saveModel(updatedModel, filePath);

  // Parse model
  const model = await loadModel(filePath);
  const keys = Object.keys(model);
  return { object: model, keys: keys };
}

module.exports = { initCharacterModel };
