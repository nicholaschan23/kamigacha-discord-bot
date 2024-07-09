const Logger = require("../../../utils/Logger");
const logger = new Logger("Card model");
const fsp = require("fs").promises;
const path = require("path");
const config = require("../../../config");
const { ensureDirExists } = require("../../../utils/fileSystem");
const { listObjects } = require("../listObjects");

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

async function getCardModel() {
  const filePath = config.CARD_MODEL_PATH;

  // Create and save model
  const existingModel = await loadModel(filePath);
  const updatedModel = await createModel("cards", existingModel);
  await saveModel(updatedModel, filePath);

  // Parse model
  const model = await loadModel(filePath);
  const keys = Object.keys(model);
  return { model: model, keys: keys };
}

module.exports = { getCardModel };
