/**
 * Converts an object into a Map and extracts its keys.
 *
 * @param {Object} data - The input object to be converted.
 * @returns {{map: Map, keys: Array}} An object containing the created Map and an array of its keys.
 */
function createMapWithKeys(data) {
  const map = new Map(Object.entries(data));
  const keys = Array.from(map.keys());
  return { map, keys };
}

module.exports = { createMapWithKeys };