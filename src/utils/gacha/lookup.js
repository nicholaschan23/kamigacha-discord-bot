const MapCache = require("@database/redis/cache/map");
const WishCountCache = require("@database/redis/cache/characterWishCount");
const CharacterResult = require("@models/CharacterResult");
const SeriesResult = require("@models/SeriesResult");
const { replaceAccents } = require("@utils/string/format");

async function lookup(query) {
  // Replace special characters and normalize the query
  const filteredQuery = replaceAccents(query)
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/gi, "") // Remove non-alphanumeric characters
    .split(/[\s,]+/); // Split query into words

  const characterResults = new Map(); // Store unique results in a map
  const seriesResults = new Map();
  let maxFrequency = 0; // Keep track of the highest frequency of search results

  for (const word of filteredQuery) {
    // Retrieve search model from cache
    const searchModel = await MapCache.getMapEntry("search-model-map", word);

    if (searchModel) {
      // Process each character-series pair in the search model
      for (const { character, series } of searchModel) {
        const key = `${character}-${series}`;
        let charResult = characterResults.get(key);

        // If result already exists, update its frequency
        if (charResult) {
          charResult.frequency++;
        } else {
          // If result is new, add it to the map with initial frequency and wish count
          const wishCount = await WishCountCache.getWishCount(character, series);
          charResult = new CharacterResult(character, series, wishCount, 1);
          characterResults.set(key, charResult);

          // Update the series results
          let seriesResult = seriesResults.get(series);
          if (seriesResult) {
            seriesResult.totalWishCount += wishCount;
            seriesResult.totalCharacters++;
          } else {
            seriesResults.set(series, new SeriesResult(series, wishCount, 1));
          }
        }

        // Update the maximum frequency if necessary
        if (charResult.frequency > maxFrequency) {
          maxFrequency = charResult.frequency;
        }
      }
    }
  }

  // Filter and sort the top results based on frequency, wish count, series, and character
  const characterResultsArray = [...characterResults.values()]
    .filter((result) => result.frequency === maxFrequency)
    .sort((a, b) => {
      return b.wishCount - a.wishCount || a.series.localeCompare(b.series) || a.character.localeCompare(b.character);
    });

  const seriesResultsArray = [...seriesResults.values()].sort((a, b) => {
    return b.totalWishCount - a.totalWishCount || b.totalCharacters - a.totalCharacters || a.series.localeCompare(b.series);
  });

  return [characterResultsArray, seriesResultsArray];
}

module.exports = { lookup };
