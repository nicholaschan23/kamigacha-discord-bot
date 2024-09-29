const { loadModel, saveModel } = require("@utils/fileSystem");

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

async function getFormattedNamesMap(keys, filePath) {
  const existingModel = await loadModel(filePath);
  const updatedModel = createModel(keys, existingModel);
  await saveModel(updatedModel, filePath);
  return updatedModel;
}

module.exports = { getFormattedNamesMap };
