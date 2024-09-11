/**
 * Checks if string is a single unicode emoji
 * @param {String} str - The unicode emoji string to validate.
 * @returns {Boolean} Returns `true` if the string is a single unicode emoji, otherwise `false`.
 */
function isOneEmoji(str) {
  const emojiRegex = require("emoji-regex");
  const regex = emojiRegex();
  const match = str.match(regex);
  return match && match.length === 1 && match[0] === str;
}

/**
 * Checks if a string contains only consonants or numbers.
 * @param {String} str - The input string to validate.
 * @returns {Boolean} Returns `true` if the string is a valid code, otherwise `false`.
 */
function isValidCode(str) {
  const regex = /^[bcdfghjklmnpqrstvwxyz0-9]+$/;
  return regex.test(str.toLowerCase());
}

/**
 * Checks if a string is a valid filter.
 * @param {String} str - The input string to validate.
 * @returns {Boolean} Returns `true` if the string is a valid filter, otherwise `false`.
 */
function isValidFilter(str) {
  const regex = /^[a-z0-9\s=!<>\-"]+$/;
  return regex.test(str.toLowerCase());
}

/**
 * Check if string containing only letters, numbers, and spaces.
 * @param {String} str - The input string to validate.
 * @returns {Boolean} Returns `true` if the string is a valid filter label, otherwise `false`.
 */
function isValidFilterLabel(str) {
  const regex = /^[a-z0-9\s]+$/;
  return regex.test(str.toLowerCase());
}

/**
 * Checks if a string contains only letters, numbers, dashes, or underscores.
 * The string "none" is considered invalid and reserved for untagged cards.
 * @param {String} str - The input string to validate.
 * @returns {Boolean} Returns `true` if the string is a valid tag, otherwise `false`.
 */
function isValidTag(str) {
  if (str === "none") {
    return false;
  }
  const regex = /^[a-z0-9_-]+$/;
  return regex.test(str.toLowerCase());
}

module.exports = {
  isOneEmoji,
  isValidCode,
  isValidFilter,
  isValidFilterLabel,
  isValidTag,
};
