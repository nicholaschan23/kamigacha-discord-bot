const Item = require("@models/Item");
const config = require("@config");

async function calculateRipValue(card, options = { sort: true }) {
  const value = [];
  value.push(new Item(`${card.rarity.toLowerCase()} material`, 1, "material"));

  if (options.sort) {
    return sortItemList(value);
  }
  return value;
}

async function calculateRipValues(cards) {
  const valueMap = new Map();

  for (const card of cards) {
    const tearValues = await calculateRipValue(card, { sort: false });
    for (const tearValue of tearValues) {
      if (valueMap.has(tearValue.name)) {
        valueMap.get(tearValue.name).quantity += tearValue.quantity;
      } else {
        valueMap.set(tearValue.name, { ...tearValue });
      }
    }
  }

  const values = Array.from(valueMap.values());
  return sortItemList(values);
}

/**
 * Sorts a list of items based on their type, name, and quantity.
 *
 * The sorting order is as follows:
 * 1. By type according to the order defined in the configuration.
 * 2. By name in alphabetical order.
 * 3. By quantity in descending order.
 *
 * @param {Item[]} items - The list of items to be sorted.
 * @returns {Item[]} The sorted list of items.
 */
function sortItemList(items) {
  const typeOrder = Object.keys(config.itemTypes);

  return items.sort((a, b) => {
    const typeComparison = typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
    if (typeComparison !== 0) return typeComparison;

    const quantityComparison = b.quantity - a.quantity; // Sort quantity in descending order
    if (quantityComparison !== 0) return quantityComparison;

    return a.name.localeCompare(b.name); // Sort name in alphabetical order
  });
}

module.exports = { calculateRipValue, calculateRipValues, sortItemList };
