const { loadModel, saveModel } = require("@utils/fileSystem");

let characterNameMapCache = null;
let seriesNameMapCache = null;

/**
 * Creates a model by formatting and mapping an array of names.
 *
 * @param {string[]} names - The array of names to be formatted and added to the model.
 * @param {Object} [existingModel={}] - An optional existing model to be extended.
 * @returns {Object} The updated model with formatted names.
 */
function createModel(names, existingModel = {}) {
  // Remove dashes and capitalize first letter of each word
  function formatName(name) {
    return name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return names.reduce((map, name) => {
    if (!map[name]) {
      map[name] = formatName(name);
    }
    return map;
  }, existingModel);
}

/**
 * Retrieves and formats names based on provided keys and updates the model stored in the specified file path.
 *
 * @param {Array<string>} keys - An array of keys to be used for formatting names.
 * @param {string} filePath - The path to the file where the model is stored.
 * @returns {Promise<Map<string, any>>} A promise that resolves to a Map containing the formatted names.
 */
async function getFormattedNames(keys, filePath) {
  const existingModel = await loadModel(filePath);
  const updatedModel = createModel(keys, existingModel);
  await saveModel(updatedModel, filePath);

  return new Map(Object.entries(updatedModel));
}

async function initCharacterNameMap(keys, filePath) {
  if (!characterNameMapCache) {
    characterNameMapCache = await getFormattedNames(keys, filePath);
  }
}

async function initSeriesNameMap(keys, filePath) {
  if (!seriesNameMapCache) {
    seriesNameMapCache = await getFormattedNames(keys, filePath);
  }
}

function getCharacterName(key) {
  return characterNameMapCache.get(key);
}

function getSeriesName(key) {
  return seriesNameMapCache.get(key);
}

module.exports = { initCharacterNameMap, initSeriesNameMap, getCharacterName, getSeriesName };
