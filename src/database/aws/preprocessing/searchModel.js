const Logger = require("../../../utils/Logger");
const logger = new Logger("Search model");
const fsp = require("fs").promises;
const path = require("path");
const config = require("../../../config");
const { ensureDirExists } = require("../../../utils/fileSystem");
const CharacterModel = require("../../mongodb/models/global/character");

/**
 * Generate all possible search results given the character and series name.
 * Results are sorted by wish count, series name, and character name.
 *
 * @param {Object} characterModel - Parsed character.json object.
 * @param {Array<String>} characterKeys - Array of series.
 * @param {Object} existingModel - Parsed searches.json object.
 * @returns {Object} Search model to save as JSON.
 */
async function createModel(characterModel, characterKeys, existingModel = {}) {
  logger.info("Fetching wish count for each character...");

  const searchModel = { ...existingModel };

  // Prepare an array of promises for fetching updated wish counts
  const promises = [];

  for (const character of characterKeys) {
    for (const series of Object.keys(characterModel[character])) {
      const characterWords = character.split("-");
      const seriesWords = series.split("-");
      const allWords = new Set([...characterWords, ...seriesWords]);

      promises.push(
        CharacterModel()
          .findOne({ character: character, series: series })
          .select("wishCount")
          .lean()
          .exec()
          .then((result) => {
            const updatedWishCount = result ? result.wishCount : 0;
            return { character, series, allWords, updatedWishCount };
          })
      );
    }
  }

  const results = await Promise.all(promises);

  results.forEach(({ character, series, allWords, updatedWishCount }) => {
    allWords.forEach((word) => {
      if (!searchModel[word]) {
        searchModel[word] = [];
      }

      const index = searchModel[word].findIndex((entry) => entry.character === character && entry.series === series);
      if (index === -1) {
        searchModel[word].push({
          character: character,
          series: series,
          wishCount: updatedWishCount,
        });
        searchModel[word].sort((a, b) => {
          return b.wishCount - a.wishCount || a.series.localeCompare(b.series) || a.character.localeCompare(b.character);
        });
      } else {
        // Update wish count from database and sort result
        if (searchModel[word][index].wishCount !== updatedWishCount) {
          searchModel[word][index].wishCount = updatedWishCount;
          searchModel[word].sort((a, b) => {
            return b.wishCount - a.wishCount || a.series.localeCompare(b.series) || a.character.localeCompare(b.character);
          });
        }
      }
    });
  });

  return searchModel;
}

async function loadModel(filePath) {
  try {
    await ensureDirExists(filePath);
    const data = await fsp.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    if (err.code === "ENOENT") {
      logger.warn("Creating file: " + path.basename(filePath));
      // If the file does not exist, return an empty object
      return {};
    } else {
      throw err;
    }
  }
}

async function saveModel(data, filePath) {
  await fsp.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
  logger.success("Saved: " + path.basename(filePath));
}

async function getSearchModel(characterModel, characterKeys) {
  const filePath = config.SEARCH_MODEL_PATH;

  // Create and save model
  const existingModel = await loadModel(filePath);
  const updatedModel = await createModel(characterModel, characterKeys, existingModel);
  await saveModel(updatedModel, filePath);

  // Parse model
  const model = await loadModel(filePath);
  return { model: model };
}

module.exports = { getSearchModel };
