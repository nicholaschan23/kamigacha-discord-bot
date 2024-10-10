const config = require("@config");
const MapCache = require("@database/redis/cache/map");
const Card = require("@models/Card");
const CharacterResult = require("@models/CharacterResult");
const Filter = require("@models/CollectionFilter");
const Item = require("@models/Item");
const Tag = require("@models/CollectionTag");
const Wish = require("@models/Wish");

/**
 * Splits an array into smaller chunks, suitable for content within an embed page.
 * @param {Objects[]} array - The array to be divided into chunks.
 * @param {Number} size - The maximum size of each chunk.
 * @returns {Objects[][]} A 2D array, where each sub-array represents a chunk of the original array.
 */
function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

/**
 * Formats the list of cards into a string output for an embed page.
 * @param {Card[]} cardList - The array of Card objects.
 * @param {Boolean} [showTags=true] - Whether to display card tag emoji.
 * @returns {String} The formatted card information string.
 */
async function formatCardInfoPage(cardList, showTags = true) {
  // Calculate max lengths for padding
  const maxCodeLength = Math.max(...cardList.map((card) => card.code.length));
  const maxRarityLength = Math.max(...cardList.map((card) => card.rarity.length));
  const maxSetLength = Math.max(...cardList.map((card) => `${card.set}`.length));

  const formattedCardList = await Promise.all(
    cardList.map(async (card) => {
      const paddedCode = card.code.padEnd(maxCodeLength, " ");
      const paddedRarity = card.rarity.padEnd(maxRarityLength, " ");
      const paddedSet = `${card.set}`.padEnd(maxSetLength, " ");

      const formattedCharacter = await MapCache.getFormattedCharacter(card.character);
      const formattedSeries = await MapCache.getFormattedSeries(card.series);

      return [
        `${showTags ? `${card.emoji} ` : ""}\`${paddedCode}\``,
        `\`${paddedRarity}\``,
        `\`◈${paddedSet}\``,
        `${formattedSeries}`,
        `**${formattedCharacter}**`,
      ].join(" · ");
    })
  );

  return formattedCardList.join("\n");
}

/**
 * Formats the list of tags into a string output for an embed page.
 * @param {Tag[]} tagList - The array of Tag objects.
 * @returns {String} The formatted tag string.
 */
function formatTagListPage(tagList) {
  return tagList
    .map(({ tag, emoji, quantity }) => {
      return [`${emoji} \`${tag}\``, `**${quantity}** card${quantity == 1 ? "" : "s"}`].join(" · ");
    })
    .join("\n");
}

/**
 * Formats the list of filters into a string output for an embed page.
 * @param {Filter[]} filterList - The array of Filter objects.
 * @returns {String} The formatted filter string.
 */
function formatFilterListPage(filterList) {
  return filterList
    .map(({ emoji, label, filter }) => {
      return [`${emoji} **${label}**`, `\`${filter}\``].join(" · ");
    })
    .join("\n");
}

/**
 * Formats the lookup results into a string output for an embed page.
 * @param {CharacterResult[]} resultList - The array of lookup result objects.
 * @returns {String} The formatted character result string.
 */
async function formatLookupPage(resultList) {
  const formattedResults = await Promise.all(
    resultList.map(async (result) => {
      const formattedCharacter = await MapCache.getFormattedCharacter(result.character);
      const formattedSeries = await MapCache.getFormattedSeries(result.series);

      return [`${getWishListEmoji(result.wishCount)} \`❤${result.wishCount}\``, `${formattedSeries}`, `**${formattedCharacter}**`].join(" · ");
    })
  );

  return formattedResults.join("\n");
}

/**
 * Formats the inventory into a string output for an embed page.
 * @param {Item[]} itemList - The array of Item objects.
 * @returns {String} The formatted inventory string output.
 */
function formatInventoryPage(itemList, options = { itemCode: true}) {
  return itemList
    .map(({ name, quantity, type }) => {
      const icon = config.itemsMap.get(name).icon;
      const nameFormatted = config.itemsMap.get(name).name;

      const result = [];
      result.push(`${icon} **${quantity}**`);
      if (options.itemCode) result.push(`\`${name}\``);
      result.push(`${nameFormatted}`);
      return result.join(" · ");
    })
    .join("\n");
}

/**
 * Formats the wish list into a string output for an embed page.
 * @param {Wish[]} wishList - The array of Wish objects.
 * @returns {String} The formatted wish list string output.
 */
async function formatWishListPage(wishList) {
  const formattedWishList = await Promise.all(
    wishList.map(async (wish) => {
      const formattedCharacter = await MapCache.getFormattedCharacter(wish.character);
      const formattedSeries = await MapCache.getFormattedSeries(wish.series);

      return [`- ${formattedSeries}`, `**${formattedCharacter}**`].join(" · ");
    })
  );

  return formattedWishList.join("\n");
}

/**
 * Associate wish count with an emoji.
 * @param {Number} wishCount - The character's wish count.
 * @returns {String} Emoji.
 */
function getWishListEmoji(wishCount) {
  if (wishCount >= 5000) {
    return "💖";
  } else if (wishCount >= 1000) {
    return "❤️";
  } else if (wishCount >= 100) {
    return "⭐";
  } else if (wishCount >= 1) {
    return "▫️";
  } else {
    return "▪️";
  }
}

module.exports = {
  chunkArray,
  formatCardInfoPage,
  formatFilterListPage,
  formatInventoryPage,
  formatLookupPage,
  formatTagListPage,
  formatWishListPage,
  getWishListEmoji,
};
