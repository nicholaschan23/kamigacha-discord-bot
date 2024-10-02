const MapCache = require("@database/redis/cache/map");
const WishCountCache = require("@database/redis/cache/characterWishCount");
const CharacterResult = require("@models/CharacterResult");
const { replaceAccents } = require("@utils/string/format");

async function lookup(query) {
  // Replace special characters and normalize the query
  const filteredQuery = replaceAccents(query)
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/gi, "") // Remove non-alphanumeric characters
    .split(/[\s,]+/); // Split query into words

  // Store unique results in a map
  const resultsMap = new Map();
  let maxFrequency = 0; // Keep track of the highest frequency of search results

  // Process each word in the filtered query
  const promises = filteredQuery.map(async (word) => {
    // Retrieve search model from cache
    const searchModel = await MapCache.getObjectFromMap("search-model-map", word);
    if (searchModel) {
      // Process each character-series pair in the search model
      const innerPromises = searchModel.map(async ({ character, series }) => {
        const key = `${character}-${series}`;
        let result = resultsMap.get(key);

        // If result already exists, update its frequency
        if (result) {
          result.frequency++;
        } else {
          // If result is new, add it to the map with initial frequency and wish count
          const wishCount = await WishCountCache.getWishCount(character, series);
          result = new CharacterResult(character, series, wishCount, 1);
          resultsMap.set(key, result);
        }

        // Update the maximum frequency if necessary
        if (result.frequency > maxFrequency) {
          maxFrequency = result.frequency;
        }
      });

      // Wait for all inner promises to complete
      await Promise.all(innerPromises);
    }
  });

  // Wait for all outer promises to complete
  await Promise.all(promises);

  // Convert the map of results to an array
  const resultsArray = [...resultsMap.values()];

  // Filter and sort the top results based on frequency, wish count, series, and character
  return resultsArray
    .filter((results) => results.frequency === maxFrequency)
    .sort((a, b) => {
      return b.wishCount - a.wishCount || a.series.localeCompare(b.series) || a.character.localeCompare(b.character);
    });
}

module.exports = { lookup };
