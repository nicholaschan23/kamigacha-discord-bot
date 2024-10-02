const MapCache = require("@database/redis/cache/map");
const CharacterResult = require("@models/CharacterResult");
const { replaceAccents } = require("@utils/string/format");

async function lookup(query) {
  // Replace special characters
  const filteredQuery = replaceAccents(query)
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/gi, "")
    .split(/[\s,]+/);

  let maxFrequency = 0; // Keep track of top search results
  const resultsMap = new Map();

  // Store unique results
  const promises = filteredQuery.map(async (word) => {
    const searchModel = await MapCache.getObjectFromMap("search-model-map", word);
    if (searchModel) {
      searchModel.forEach(({ character, series, wishCount }) => {
        const key = `${character}-${series}`;
        let result = resultsMap.get(key);

        // Repeat result, update frequency
        if (result) {
          result.frequency++;
        } else {
          // New result, add new map entry
          result = new CharacterResult(character, series, wishCount, 1);
          resultsMap.set(key, result);
        }

        // Update max frequency
        if (result.frequency > maxFrequency) {
          maxFrequency = result.frequency;
        }
      });
    }
  });

  // Wait for all promises to complete
  await Promise.all(promises);

  // Convert map to array
  const resultsArray = [...resultsMap.values()];

  // Filter and sort top results
  return resultsArray
    .filter((results) => results.frequency === maxFrequency)
    .sort((a, b) => {
      return b.wishCount - a.wishCount || a.series.localeCompare(b.series) || a.character.localeCompare(b.character);
    });
}

module.exports = { lookup };
