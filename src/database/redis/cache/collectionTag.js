const config = require("@config");
const TagModel = require("@database/mongodb/models/user/tag");
const RedisClient = require("@database/redis/RedisClient");

const EXPIRATION = config.redisExpiration.default;
const redis = RedisClient.connection;

async function getDocument(userId) {
  const key = `collection-tag:${userId}`;

  let value = await redis.get(key);

  if (value === null) {
    // Document not found in cache, fetch from database
    const tagDocument = await TagModel.findOneAndUpdate({ userId: userId }, { $setOnInsert: { userId: userId } }, { new: true, upsert: true });
    value = tagDocument;
    await cache(userId, tagDocument);
  } else {
    value = JSON.parse(value);
  }

  return value;
}

async function cache(userId, object) {
  const key = `collection-tag:${userId}`;
  const value = JSON.stringify(object);
  await redis.set(key, value);
  redis.expire(key, EXPIRATION);
}

module.exports = {
  getDocument,
  cache,
};
