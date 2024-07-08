const fsp = require("fs").promises;
const Logger = require("../../../utils/Logger");
const logger = new Logger("Search model");
const config = require("../../../config");
const { ensureDirExists } = require("../../../utils/fileSystem");

// Preprocess all possible search results
async function preprocessSearchModel(characterMap, characterKeys) {
  const searchMap = {};

  for (const character of characterKeys) {
    const series = Object.keys(characterMap[character])[0];
    const characterWords = character.split("-");
    const seriesWords = series.split("-");
    const allWords = new Set([...characterWords, ...seriesWords]);

    allWords.forEach((word) => {
      if (!searchMap[word]) {
        searchMap[word] = [];
      }
      searchMap[word].push({ character: character, series: series, wishlist: 0 });
    });
  }

  // Write data to file asynchronously
  try {
    await fsp.writeFile(config.SEARCH_MODEL_PATH, JSON.stringify(searchMap, null, 2), { flag: "w" });
    logger.success(`Saved model: searches`);
  } catch (err) {
    logger.error("Error writing to file:" + err);
    throw err;
  }
}

async function loadSearchModel(jsonCards, seriesKeys) {
  try {
    await fsp.access(config.SEARCH_MODEL_PATH);
    logger.info(`Loaded model: searches`);
  } catch {
    await ensureDirExists(config.SEARCH_MODEL_PATH);
    await preprocessSearchModel(jsonCards, seriesKeys);
  }

  const data = await fsp.readFile(config.SEARCH_MODEL_PATH, "utf8");
  const parsedJson = JSON.parse(data);
  const keys = Object.keys(parsedJson);
  return { object: parsedJson, keys: keys };
}

function search(query, searchMap) {
  const queryWords = query
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "")
    .split(/[\s,]+/);
  const matchedCharacters = {};

  queryWords.forEach((word) => {
    if (searchMap[word]) {
      searchMap[word].forEach(({ character, data }) => {
        if (!matchedCharacters[character]) {
          matchedCharacters[character] = {
            character,
            data,
            count: 0,
          };
        }
        matchedCharacters[character].count++;
      });
    }
  });

  const results = [];
  for (const character in matchedCharacters) {
    if (matchedCharacters[character].count === queryWords.length) {
      results.push(matchedCharacters[character].data);
    }
  }

  return results;
}

module.exports = { loadSearchModel };
