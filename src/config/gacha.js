const rarities = ["C", "R", "UR", "SR", "SSR"];
const origins = ["Pull", "Multi-Pull", "Upgrade"];

function getNextRarity(currentRarity) {
  const currentIndex = rarities.indexOf(currentRarity);
  if (currentIndex === -1 || currentIndex === rarities.length - 1) {
    return null; // Return null if the rarity is not found or if it is the last one
  }
  return rarities[currentIndex + 1];
}

function getRarityRank(rarity) {
  switch (rarity) {
    case "c":
      return 1;
    case "r":
      return 2;
    case "ur":
      return 3;
    case "sr":
      return 4;
    case "ssr":
      return 5;
    case "C":
      return 1;
    case "R":
      return 2;
    case "UR":
      return 3;
    case "SR":
      return 4;
    case "SSR":
      return 5;
    default:
      return -1;
  }
}

// Rates in percentages
const pullRateArr = [70, 15, 7, 5, 3];
const pullRate = [
  { rarity: "C", chance: pullRateArr[0] },
  { rarity: "R", chance: pullRateArr[1] },
  { rarity: "UR", chance: pullRateArr[2] },
  { rarity: "SR", chance: pullRateArr[3] },
  { rarity: "SSR", chance: pullRateArr[4] },
];
const multiPullRate = [
  { rarity: "C", chance: 80 },
  { rarity: "R", chance: 10 },
  { rarity: "UR", chance: 6 },
  { rarity: "SR", chance: 3 },
  { rarity: "SSR", chance: 1 },
];

// After X amount of pulls and you haven't gotten the respective rarity, guarantee that rarity
const pity = {
  UR: 30,
  SR: 50,
  SSR: 100,
};

// Fail rate influenced per rarity of card in percentages
const upgradeFailRate = {
  C: 0,
  R: 1,
  UR: 3,
  SR: 5,
};

// Card dimensions
const cardWidth = 288;
const cardHeight = 400;
const cardBorder = 20;

module.exports = {
  rarities,
  origins,
  getNextRarity,
  getRarityRank,
  pullRateArr,
  pullRate,
  multiPullRate,
  pity,
  upgradeFailRate,
  cardWidth,
  cardHeight,
  cardBorder,
};
