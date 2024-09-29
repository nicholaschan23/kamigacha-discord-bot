const config = require("@config");
const { loadModel, saveModel } = require("@utils/fileSystem");
const { listObjects } = require("../listObjects");

/**
 * Creates a hierarchical model of objects based on the given prefix and existing model.
 * It lists objects with the specified prefix and organizes them into a nested structure.
 * Only files with a ".jpg" extension are included in the model.
 *
 * @param {string} prefix - The prefix used to list objects.
 * @param {Object} [existingModel={}] - An optional existing model to merge with.
 * @returns {Promise<Object>} A promise that resolves to the hierarchical model.
 */
async function createModel(prefix, existingModel = {}) {
  const keys = await listObjects(prefix);

  return keys.reduce((acc, key) => {
    const parts = key.slice(`${prefix}/`.length).split("/");
    const fileName = parts.pop();
    const fileType = fileName.slice(-4);

    if (fileType === ".jpg") {
      let current = acc;
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          // If this is the last part, initialize it as an array if it doesn't exist
          if (!current[part]) {
            current[part] = [];
          }
          // Push the file name if it doesn't already exist in the array
          if (!current[part].includes(fileName)) {
            current[part].push(fileName);
          }
        } else {
          // Otherwise, keep nesting
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
      });
    }

    return acc;
  }, existingModel);
}

async function initCardModel() {
  const filePath = config.CARD_MODEL_PATH;

  // Create and save model
  const existingModel = await loadModel(filePath);
  const updatedModel = await createModel("cards", existingModel);
  await saveModel(updatedModel, filePath);

  // Parse model
  const model = await loadModel(filePath);
  const keys = Object.keys(model);
  return { object: model, keys: keys };
}

module.exports = { initCardModel };
