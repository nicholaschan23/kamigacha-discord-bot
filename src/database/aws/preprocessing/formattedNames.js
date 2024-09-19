const Logger = require("../../../utils/Logger");
const logger = new Logger("Formatted names");
const fsp = require("fs").promises;
const path = require("path");
const { ensureDirExists } = require("../../../utils/fileSystem");

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

async function getFormattedNames(keys, filePath) {
  const existingModel = await loadModel(filePath);
  const updatedModel = createModel(keys, existingModel);
  await saveModel(updatedModel, filePath);

  return new Map(Object.entries(updatedModel));
}

module.exports = { getFormattedNames };
