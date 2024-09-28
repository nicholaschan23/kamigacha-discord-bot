const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");
const Logger = require("@utils/Logger");
const logger = new Logger("File system");

/**
 * Retrieves all JavaScript files from a specified directory.
 *
 * @param {String} directory - The directory to search for JavaScript files.
 * @returns {String[]} An array of JavaScript file names.
 */
function getJsFiles(directory) {
  return fs.readdirSync(directory).filter((file) => file.endsWith(".js"));
}

/**
 * Abbreviates a directory path by removing the prefix up to and including the specified key.
 *
 * @param {String} directory - The full directory path to abbreviate.
 * @returns {String} The abbreviated directory path.
 */
function abbrevCmdPath(directory) {
  const key = "commands/";
  return directory.slice(directory.indexOf(key) + key.length);
}

// Helper function to ensure directory exists
async function ensureDirExists(filePath) {
  const dir = path.dirname(filePath);
  try {
    await fsp.mkdir(dir, { recursive: true });
  } catch (err) {
    logger.error(`Error creating directory ${dir}:`, err);
    throw err;
  }
}

async function fileExists(filePath) {
  try {
    await fsp.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Loads a JSON model from the specified file path.
 * If the file does not exist, it creates the file and returns an empty object.
 *
 * @param {string} filePath - The path to the JSON file to load.
 * @returns {Promise<Object>} A promise that resolves to the parsed JSON object.
 * @throws {Error} Throws an error if reading the file fails for reasons other than non-existence.
 */
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

/**
 * Saves the given data to a specified file path in JSON format.
 *
 * @param {Object} data - The data to be saved.
 * @param {string} filePath - The path where the data should be saved.
 * @returns {Promise<void>} A promise that resolves when the file has been written.
 */
async function saveModel(data, filePath) {
  await fsp.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
  logger.success("Saved: " + path.basename(filePath));
}

module.exports = {
  getJsFiles,
  abbrevCmdPath,
  ensureDirExists,
  fileExists,
  loadModel,
  saveModel,
};
