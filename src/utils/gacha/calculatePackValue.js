require("module-alias/register");

const MapCache = require("@database/redis/cache/map");
const config = require("@config");

const BASE_COST = 30;

/**
 * Fetches the count of rarities from a series and set.
 * @param {string} series - The series to fetch.
 * @param {string} set - The set to fetch.
 * @returns {Promise<number[]>} An array where the index corresponds to the rarity and the value is the count of that rarity.
 */
function fetchRarityCounts(setModel) {
  const rarityFrequency = [0, 0, 0, 0, 0];

  Object.entries(setModel).map(([rarity, filenames]) => {
    const rarityIndex = config.rarities.indexOf(rarity);
    rarityFrequency[rarityIndex] += filenames.length;
  });

  return rarityFrequency;
}

/**
 * Calculates the value of a pack based on the number of rarities in the set.
 * @param {number[]} frequencyArr - The frequency of each rarity in the set.
 * @returns {number} The total value of the pack.
 */
function calculatePackValue(frequencyArr) {
  const ssrCount = frequencyArr[4]; // Assuming SSR is at index 4

  let multiplier = 0.5; // Default multiplier for 0 SSR cards
  if (ssrCount === 1) {
    multiplier = 1;
  } else if (ssrCount === 2) {
    multiplier = 1.5;
  } else if (ssrCount === 3) {
    multiplier = 2;
  } else if (ssrCount === 4) {
    multiplier = 2.5;
  } else if (ssrCount >= 5) {
    multiplier = 3;
  }

  const finalCost = BASE_COST * multiplier;

  return finalCost;
}

module.exports = { fetchRarityCounts, calculatePackValue };
