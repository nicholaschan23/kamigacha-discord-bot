const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");

/**
 * Retrieves all JavaScript files from a specified directory.
 *
 * @param {string} directory - The directory to search for JavaScript files.
 * @returns {string[]} - An array of JavaScript file names.
 */
function getJsFiles(directory) {
  return fs.readdirSync(directory).filter((file) => file.endsWith(".js"));
}

/**
 * Abbreviates a directory path by removing the prefix up to and including the specified key.
 *
 * @param {string} directory - The full directory path to abbreviate.
 * @returns {string} - The abbreviated directory path.
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

module.exports = {
  getJsFiles,
  abbrevCmdPath,
  ensureDirExists,
};
