const MapCache = require("@database/redis/cache/map");

/**
 * Capitalize first letter of a string.
 * @param {String} str Input string.
 * @returns Formatted string.
 */
function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format Card data into a readable string.
 * @param {Card} card An object with card data.
 * @returns The formatted string.
 */
async function formatCardInfo(card) {
  const formattedCharacter = await MapCache.getFormattedCharacter(card.character);
  const formattedSeries = await MapCache.getFormattedSeries(card.series);
  return [`\`${card.code}\``, `\`${card.rarity}\``, `\`◈${card.set}\``, `${formattedSeries}`, `**${formattedCharacter}**`].join(" · ");
}

/**
 * Replaces all accented chars with regular ones.
 * @param {String} str The input string.
 * @returns Formatted string.
 */
function replaceAccents(str) {
  // Verifies if the string has accents and replace them
  if (str.search(/[\xC0-\xFF]/g) > -1) {
    str = str
      .replace(/[\xC0-\xC5]/g, "A")
      .replace(/[\xC6]/g, "AE")
      .replace(/[\xC7]/g, "C")
      .replace(/[\xC8-\xCB]/g, "E")
      .replace(/[\xCC-\xCF]/g, "I")
      .replace(/[\xD0]/g, "D")
      .replace(/[\xD1]/g, "N")
      .replace(/[\xD2-\xD6\xD8]/g, "O")
      .replace(/[\xD9-\xDC]/g, "U")
      .replace(/[\xDD]/g, "Y")
      .replace(/[\xDE]/g, "P")
      .replace(/[\xE0-\xE5]/g, "a")
      .replace(/[\xE6]/g, "ae")
      .replace(/[\xE7]/g, "c")
      .replace(/[\xE8-\xEB]/g, "e")
      .replace(/[\xEC-\xEF]/g, "i")
      .replace(/[\xF1]/g, "n")
      .replace(/[\xF2-\xF6\xF8]/g, "o")
      .replace(/[\xF9-\xFC]/g, "u")
      .replace(/[\xFE]/g, "p")
      .replace(/[\xFD\xFF]/g, "y");
  }
  return str;
}

module.exports = {
  capitalizeFirstLetter,
  formatCardInfo,
  replaceAccents,
};
