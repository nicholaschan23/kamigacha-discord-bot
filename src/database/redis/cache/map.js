const RedisClient = require("@database/redis/RedisClient");

const redis = RedisClient.connection;

/**
 * Stores a given model as a map in Redis.
 *
 * @param {string} cacheKey - The key under which the map will be stored in Redis.
 * @param {Object} model - The model object to be stored as a map.
 * @returns {Promise<void>} A promise that resolves when the map is successfully stored.
 */
async function storeModelAsMap(cacheKey, model) {
  // Convert the model to a format suitable for hmset
  const entries = Object.entries(model).reduce((acc, [key, value]) => {
    acc[key] = JSON.stringify(value);
    return acc;
  }, {});

  // Store the map in Redis
  await redis.hmset(`${cacheKey}-map`, entries);
}

/**
 * Retrieves a map entry from the Redis cache.
 *
 * @param {string} cacheKey - The key of the cache where the map is stored.
 * @param {string} mapKey - The key of the map entry to retrieve.
 * @returns {Promise<Object|null>} A promise that resolves to the parsed JSON object if the entry exists, or null if it does not.
 */
async function getMapEntry(cacheKey, mapKey) {
  const value = await redis.hget(cacheKey, mapKey);
  return value ? JSON.parse(value) : null;
}

/**
 * Retrieves a list of elements from a Redis list stored at the specified cache key.
 *
 * @param {string} cacheKey - The key of the Redis list.
 * @param {number} [start=0] - The starting index of the range to retrieve (inclusive).
 * @param {number} [end=-1] - The ending index of the range to retrieve (inclusive). Defaults to -1, which means the end of the list.
 * @returns {Promise<Array>} A promise that resolves to an array of elements from the specified range in the Redis list.
 */
async function getList(cacheKey, start = 0, end = -1) {
  return await redis.lrange(cacheKey, start, end);
}

/**
 * Retrieves a formatted character from the Redis cache.
 *
 * @param {string} character - The name of the character to retrieve.
 * @returns {Promise<Object|string>} A promise that resolves to the formatted character object if found, or the original character name if not found.
 */
async function getFormattedCharacter(character) {
  const value = await redis.hget("character-name-map", character);
  return value ? JSON.parse(value) : character;
}

/**
 * Retrieves a formatted series name from the Redis cache.
 * If the series name is not found in the cache, it returns the original series name.
 *
 * @param {string} series - The name of the series to retrieve from the cache.
 * @returns {Promise<string>} A promise that resolves to the formatted series name or the original series name if not found in the cache.
 */
async function getFormattedSeries(series) {
  const value = await redis.hget("series-name-map", series);
  return value ? JSON.parse(value) : series;
}

module.exports = { storeModelAsMap, getMapEntry, getList, getFormattedCharacter, getFormattedSeries };
