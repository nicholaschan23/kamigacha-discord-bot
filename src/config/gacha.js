const rarities = ["C", "R", "UR", "SR", "SSR"];

function getNextRarity(currentRarity) {
  const currentIndex = rarities.indexOf(currentRarity);
  if (currentIndex === -1 || currentIndex === rarities.length - 1) {
    return null; // Return null if the rarity is not found or if it is the last one
  }
  return rarities[currentIndex + 1];
}

module.exports = {
  rarities,
  getNextRarity,

  // Rates in percentages
  pullRate: [
    { rarity: "C", chance: 70 },
    { rarity: "R", chance: 15 },
    { rarity: "UR", chance: 7 },
    { rarity: "SR", chance: 5 },
    { rarity: "SSR", chance: 3 },
  ],
  multiPullRate: [
    { rarity: "C", chance: 80 },
    { rarity: "R", chance: 10 },
    { rarity: "UR", chance: 6 },
    { rarity: "SR", chance: 3 },
    { rarity: "SSR", chance: 1 },
  ],

  // After X amount of pulls and you haven't gotten the respective rarity, guarantee that rarity
  pity: {
    UR: 30,
    SR: 50,
    SSR: 100,
  },

  // Fail rate influenced per rarity of card in percentages
  upgradeFailRate: {
    C: 0,
    R: 1,
    UR: 3,
    SR: 5,
  },
};
