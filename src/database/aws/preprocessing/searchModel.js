const config = require("@config");
const Logger = require("@utils/Logger");
const { loadModel, saveModel } = require("@utils/fileSystem");

const logger = new Logger("Search model");

/**
 * Generate all possible search results given the character and series name.
 * Results are sorted by wish count, series name, and character name.
 *
 * @param {Object} characterModel - Parsed character.json object.
 * @param {Array<string>} characterKeys - Array of series.
 * @param {Object} existingModel - Parsed searches.json object.
 * @returns {Object} Search model to save as JSON.
 */
async function createModel(characterModel, characterKeys, existingModel = {}) {
  logger.info("Fetching wish count for each character...");

  const searchModel = { ...existingModel };

  const results = [];
  for (const character of characterKeys) {
    for (const series of Object.keys(characterModel[character])) {
      const characterWords = character.split("-");
      const seriesWords = series.split("-");
      const allWords = new Set([...characterWords, ...seriesWords]);
      results.push({ character, series, allWords });
    }
  }

  results.forEach(({ character, series, allWords }) => {
    allWords.forEach((word) => {
      if (!searchModel[word]) {
        searchModel[word] = [];
      }

      // Add character and series to search model if it doesn't exist
      const index = searchModel[word].findIndex((entry) => entry.character === character && entry.series === series);
      if (index === -1) {
        searchModel[word].push({
          character: character,
          series: series,
        });
        searchModel[word].sort((a, b) => {
          return a.series.localeCompare(b.series) || a.character.localeCompare(b.character);
        });
      }
    });
  });

  return searchModel;
}

async function initSearchModel(characterModel, characterKeys) {
  const filePath = config.SEARCH_MODEL_PATH;

  // Create and save model
  const existingModel = await loadModel(filePath);
  const updatedModel = await createModel(characterModel, characterKeys, existingModel);
  await saveModel(updatedModel, filePath);

  // Parse model
  const model = await loadModel(filePath);
  const keys = Object.keys(model);
  return { object: model, keys: keys };
}

module.exports = { initSearchModel };
