const RedisClient = require("@database/redis/RedisClient");

const redis = RedisClient.connection;

async function storeModelAsMap(redisKey, model, storeKeys = true) {
  
  // Convert the model to a format suitable for hmset
  const entries = Object.entries(model).reduce((acc, [key, value]) => {
    acc[key] = JSON.stringify(value);
    return acc;
  }, {});

  // Store the map in Redis
  await redis.hmset(`${redisKey}Map`, entries);

  if (storeKeys) {
    // Extract the keys from the model
    const keys = Object.keys(model);

    // Store the keys array in a Redis list
    await redis.rpush(`${redisKey}Keys`, keys);
  }
}

async function getObjectFromMap(redisKey, mapKey) {
  
  const value = await redis.hget(redisKey, mapKey);
  return JSON.parse(value);
}

module.exports = { storeModelAsMap, getObjectFromMap };
