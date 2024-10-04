const config = require("@config");
const BinderModel = require("@database/mongodb/models/user/binder");
const RedisClient = require("@database/redis/RedisClient");

const EXPIRATION = config.redisExpiration.default;
const redis = RedisClient.connection;

async function getDocument(userId) {
  const key = `collection-binder:${userId}`;

  let value = await redis.get(key);

  if (value === null) {
    // Document not found in cache, fetch from database
    const binderDocument = await BinderModel.findOneAndUpdate({ userId: userId }, { $setOnInsert: { userId: userId } }, { new: true, upsert: true });
    value = binderDocument;
    await cache(userId, binderDocument);
  } else {
    value = JSON.parse(value);
  }

  return value;
}

async function cache(userId, object) {
  const key = `collection-binder:${userId}`;
  const value = JSON.stringify(object);
  await redis.set(key, value);
  redis.expire(key, EXPIRATION);
}

module.exports = {
  getDocument,
  cache,
};
