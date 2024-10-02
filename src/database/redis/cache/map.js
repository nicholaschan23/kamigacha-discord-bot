const RedisClient = require("@database/redis/RedisClient");

const redis = RedisClient.connection;

async function storeModelAsMap(cacheKey, model, storeKeys = true) {
  // Convert the model to a format suitable for hmset
  const entries = Object.entries(model).reduce((acc, [key, value]) => {
    acc[key] = JSON.stringify(value);
    return acc;
  }, {});

  // Store the map in Redis
  await redis.hmset(`${cacheKey}-map`, entries);

  if (storeKeys) {
    // Extract the keys from the model
    const keys = Object.keys(model);

    // Store the keys array in a Redis list
    await redis.rpush(`${cacheKey}-keys`, keys);
  }
}

async function getModel(cacheKey) {
  const value = await redis.hgetall(cacheKey);
  return value ? Object.fromEntries(Object.entries(value).map(([key, val]) => [key, JSON.parse(val)])) : null;
}

async function getMapEntry(cacheKey, mapKey) {
  const value = await redis.hget(cacheKey, mapKey);
  return value ? JSON.parse(value) : null;
}

async function getList(cacheKey, start = 0, end = -1) {
  return await redis.lrange(cacheKey, start, end);
}

async function getFormattedCharacter(character) {
  const value = await redis.hget("character-name-map", character);
  return value ? JSON.parse(value) : character;
}

async function getFormattedSeries(series) {
  const value = await redis.hget("series-name-map", series);
  return value ? JSON.parse(value) : series;
}

module.exports = { storeModelAsMap, getMapEntry, getList, getFormattedCharacter, getFormattedSeries };
