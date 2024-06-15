const config = require("../../config");
const crypto = require("crypto");

/**
 * Generates a random rarity based on predefined chances using a secure random number generator.
 *
 * @returns {string} The rarity of the pull.
 */
function getRandomRarity() {
  const randomBuffer = crypto.randomBytes(4);
  const randomNum = (randomBuffer.readUInt32LE() / 0xffffffff) * 100;
  let cumulativeChance = 0;

  for (const rarity of config.pullRate) {
    cumulativeChance += rarity.chance;
    if (randomNum <= cumulativeChance) {
      return rarity.rarity;
    }
  }
  return "C"; // Default to "Common" if no other rarity is selected
}

function checkPity(userID) {
  // Fetch user from database
  // If pity reached
}

function updatePity() {
  
}

function getCardPull() {
  return "C"
}

module.exports = {
  getRandomRarity,
};
