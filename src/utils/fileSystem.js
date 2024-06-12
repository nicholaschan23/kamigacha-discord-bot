const fs = require("fs");

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

module.exports = {
  getJsFiles,
  abbrevCmdPath,
};
