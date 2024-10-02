const config = require("@config");
const WishModel = require("@database/mongodb/models/user/wish");
const RedisClient = require("@database/redis/RedisClient");

const EXPIRATION = config.redisExpiration.default;
const redis = RedisClient.connection;

async function getDocument(userId) {
  const key = `character-wish:${userId}`;

  let value = await redis.get(key);

  if (value === null) {
    // Document not found in cache, fetch from database
    const wishDocument = await WishModel.findOneAndUpdate({ userId: userId }, { $setOnInsert: { userId: userId } }, { new: true, upsert: true });
    await redis.set(key, JSON.stringify(wishDocument));
    return wishDocument;
  }

  return JSON.parse(value);
}

async function cache(userId, object) {
  const key = `character-wish:${userId}`;
  const value = JSON.stringify(object);
  await redis.set(key, value);
  await redis.expire(key, EXPIRATION);
}

module.exports = {
  getDocument,
  cache,
};
