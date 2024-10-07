const Item = require("@models/Item");

async function calculateBurn(card) {
  const value = [];
  value.push(new Item(`${card.rarity.toLowerCase()} material`, 1, "material"));

  return value;
}

module.exports = { calculateBurn };
