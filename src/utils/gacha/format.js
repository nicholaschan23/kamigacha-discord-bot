const emojiRegex = require("emoji-regex");
const client = require("../../../bot");

function formatCardInfo(data) {
  return [`\`${data.code}\``, `\`${data.rarity}\``, `\`◈${data.set}\``, `${client.seriesNameMap[data.series]}`, `**${client.characterNameMap[data.character]}**`].join(" · ");
}

function formatCardInfoPage(dataList, showTags = true) {
  // Calculate max lengths for padding
  const maxCodeLength = Math.max(...dataList.map((data) => data.code.length));
  const maxRarityLength = Math.max(...dataList.map((data) => data.rarity.length));
  const maxSetLength = Math.max(...dataList.map((data) => `${data.set}`.length));

  return dataList
    .map((data) => {
      const paddedCode = data.code.padEnd(maxCodeLength, " ");
      const paddedRarity = data.rarity.padEnd(maxRarityLength, " ");
      const paddedSet = `${data.set}`.padEnd(maxSetLength, " ");

      return [`${showTags ? `${data.emoji} ` : ""}\`${paddedCode}\``, `\`${paddedRarity}\``, `\`◈${paddedSet}\``, `${client.seriesNameMap[data.series]}`, `**${client.characterNameMap[data.character]}**`].join(" · ");
    })
    .join("\n");
}

/**
 * Formats the tag information from a Map into a specific structure.
 *
 * @param {Map} tagList - A Map where keys are tag names and values are objects with emoji and quantity properties.
 * @returns {string} - Formatted tag info for display.
 */
function formatTagListPage(tagList) {
  const formattedTags = [];

  for (const element of tagList) {
    const { tag, emoji, quantity } = element;
    formattedTags.push([`${emoji} \`${tag}\``, `**${quantity}** card${quantity == 1 ? "" : "s"}`].join(" · "));
  }

  return formattedTags.join("\n");
}

// Check if string containing only letters and numbers
// function isValidCode(input) {
//   const regex = /^[a-z0-9]+$/;
//   return regex.test(input);
// }

// Check if string containing only letters, numbers, dashes, or underscores
function isValidTag(input) {
  // Reserved tag for untagged cards
  if (input === "none") {
    return false;
  }

  const regex = /^[a-z0-9_-]+$/;
  return regex.test(input);
}

// Checks if input is a single unicode emoji
function containsExactlyOneEmoji(input) {
  const regex = emojiRegex();
  const match = input.match(regex);
  return match && match.length === 1 && match[0] === input;
}

// Split the list of cards into chunks
const chunkArray = (array, chunkSize) => {
  const result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
};

function isValidFilter(input) {
  const regex = /^[a-z0-9\s=!<>\-"]+$/;
  return regex.test(input);
}

/**
 * Check if string containing only letters, numbers, and spaces.
 * 
 * @param {string} input - Filter label.
 * @returns {string} Formatted filter label.
 */
function isValidFilterLabel(input) {
  const regex = /^[a-zA-Z0-9\s]+$/;
  return regex.test(input);
}

/**
 * Formats the filter into a string output for an embed page.
 *
 * @param {Array<Object>} filterList - The array of filter property objects.
 * @param {string} filterList[].emoji - The filter emoji.
 * @param {string} filterList[].label - The filter label.
 * @param {string} filterList[].filter - The filter string.
 * @returns {string} Formatted filter info for display.
 */
function formatFilterListPage(filterList) {
  const formattedFilters = [];

  for (const fObject of filterList) {
    const { emoji, label, filter } = fObject;
    formattedFilters.push([`${emoji} **${label}**`, `\`${filter}\``].join(" · "));
  }

  return formattedFilters.join("\n");
}

/**
 * Associate wishlist amount with an emoji.
 * 
 * @param {number} wishlist - The character's wishlist amount.
 * @returns {string} Emoji.
 */
function getWishlistEmoji(wishlist) {
  if (wishlist >= 5000) {
    return "💖";
  } else if (wishlist >= 1000) {
    return "❤️";
  } else if (wishlist >= 100) {
    return "⭐";
  } else if (wishlist >= 1) {
    return "▫️";
  } else {
    return "▪️";
  }
}

/**
 * Formats the lookup results into a string output for an embed page.
 *
 * @param {Array<Object>} results - The array of lookup result objects.
 * @param {number} results[].wishlist - The character's wishlist amount.
 * @param {string} results[].series - The name of the series the character belongs to.
 * @param {string} results[].character - The name of the character.
 * @returns {string} The formatted string output.
 */
function formatLookupPage(results) {
  const output = [];
  for (const r of results) {
    output.push([`${getWishlistEmoji(r.wishlist)} \`❤${r.wishlist}\``, `${client.seriesNameMap[r.series]}`, `**${client.characterNameMap[r.character]}**`].join(" · "));
  }
  return output.join("\n");
}

/**
 * Formats the wishlist into a string output for an embed page.
 * 
 * @param {Array<Object>} wishlist - The array of wishlist objects.
 * @param {string} wishlist[].series - The name of the series the character belongs to.
 * @param {string} wishlist[].character - The name of the character.
 * @returns {string} The formatted string output.
 */
function formatWishlistPage(wishlist) {
  const output = [];
  for (const item of wishlist) {
    output.push([`- ${client.seriesNameMap[item.series]}`, `**${client.characterNameMap[item.character]}**`].join(" · "));
  }
  return output.join("\n");
}

module.exports = {
  formatCardInfo,
  formatCardInfoPage,

  formatTagListPage,
  isValidTag,

  containsExactlyOneEmoji,
  chunkArray,

  isValidFilter,
  isValidFilterLabel,
  formatFilterListPage,

  getWishlistEmoji,
  formatLookupPage,
  formatWishlistPage,
};
