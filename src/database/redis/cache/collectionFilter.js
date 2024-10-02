const config = require("@config");
const FilterModel = require("@database/mongodb/models/user/filter");
const RedisClient = require("@database/redis/RedisClient");

const EXPIRATION = config.redisExpiration.default;
const redis = RedisClient.connection;

async function getDocument(userId) {
  const key = `collection-filter:${userId}`;

  let value = await redis.get(key);

  if (value === null) {
    // Document not found in cache, fetch from database
    const filterDocument = await FilterModel.findOneAndUpdate({ userId: userId }, { $setOnInsert: { userId: userId } }, { new: true, upsert: true });
    value = filterDocument;
    await cache(userId, filterDocument);
  } else {
    value = JSON.parse(value);
  }

  return value;
}

async function cache(userId, object) {
  const key = `collection-filter:${userId}`;
  const value = JSON.stringify(object);
  await redis.set(key, value);
  redis.expire(key, EXPIRATION);
}

module.exports = {
  getDocument,
  cache,
};
