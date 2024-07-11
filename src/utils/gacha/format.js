function formatCardInfo(data) {
  return [`\`${data.code}\``, `\`${data.rarity}\``, `\`◈${data.set}\``, `*${data.series}*`, `**${data.character}**`].join(" · ");
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

      return [`${showTags ? `${data.emoji} ` : ""}\`${paddedCode}\``, `\`${paddedRarity}\``, `\`◈${paddedSet}\``, `*${data.series}*`, `**${data.character}**`].join(" · ");
    })
    .join("\n");
}

/**
 * Formats the tag information from a Map into a specific structure.
 *
 * @param {Map} tagList - A Map where keys are tag names and values are objects with emoji and quantity properties.
 * @returns {String} - Formatted tag info for display.
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
const emojiRegex = require("emoji-regex");
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

// Check if string containing only letters, numbers, and spaces
function isValidFilterLabel(input) {
  const regex = /^[a-zA-Z0-9\s]+$/;
  return regex.test(input);
}

/**
 * Formats the filter information from an array into a specific structure.
 *
 * @param {Array} filterList - An array of objects with emoji, label, and filter properties.
 * @returns {String} - Formatted filter info for display.
 */
function formatFilterListPage(filterList) {
  const formattedFilters = [];

  for (const fObject of filterList) {
    const { emoji, label, filter } = fObject;
    formattedFilters.push([`${emoji} **${label}**`, `\`${filter}\``].join(" · "));
  }

  return formattedFilters.join("\n");
}

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
  // if (wishlist >= 10000) {
  //   return ":heartpulse:";
  // } else if (wishlist >= 1000) {
  //   return ":heart:";
  // } else if (wishlist >= 100) {
  //   return ":star";
  // } else if (wishlist >= 1) {
  //   return ":white_small_square:";
  // } else {
  //   return ":black_small_square:";
  // }
}

function formatLookupPage(results) {
  const output = [];
  for (const r of results) {
    output.push([`${getWishlistEmoji(r.wishlist)} \`❤${r.wishlist}\``, `${r.series}`, `**${r.character}**`].join(" · "));
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

  formatLookupPage,
  getWishlistEmoji,
};
