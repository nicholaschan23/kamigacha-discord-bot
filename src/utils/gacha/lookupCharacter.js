const CharacterResult = require("../../models/CharacterResult");
const { replaceAccents } = require("../string/format");

function lookup(query, searchMap) {
  // Replace special characters
  const filteredQuery = replaceAccents(query)
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/gi, "")
    .split(/[\s,]+/);

  let maxCount = 0; // Keep track of top search results
  const resultsMap = new Map();

  // Store unique results
  filteredQuery.forEach((word) => {
    if (searchMap[word]) {
      searchMap[word].forEach(({ character, series, wishCount }) => {
        const key = `${character}-${series}`;
        const result = resultsMap.get(key);

        // Repeat result, update count
        if (result) {
          result.count++;
        }
        // New result, add new map entry
        else {
          resultsMap.set(key, new CharacterResult(character, series, wishCount, 1));
        }

        // Update max count
        if (result.count > maxCount) {
          maxCount = result.count;
        }
      });
    }
  });

  // Convert map to array
  const resultsArray = [...resultsMap.values()];

  // Filter and sort top results
  return resultsArray
    .filter((results) => results.count === maxCount)
    .sort((a, b) => {
      return b.wishCount - a.wishCount || a.series.localeCompare(b.series) || a.character.localeCompare(b.character);
    });
}

module.exports = { lookup };
