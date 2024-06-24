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

      return [`${showTags ? `${data.tag} ` : ""}\`${paddedCode}\``, `\`${paddedRarity}\``, `\`◈${paddedSet}\``, `*${data.series}*`, `**${data.character}**`].join(" · ");
    })
    .join("\n");
}

// Check if string containing only letters, numbers, dashes, or underscores
function isValidTag(input) {
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

module.exports = {
  formatCardInfo,
  formatCardInfoPage,
  isValidTag,
  containsExactlyOneEmoji,
};
