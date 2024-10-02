const config = require("@config");
const CharacterModel = require("@database/mongodb/models/global/character");
const RedisClient = require("@database/redis/RedisClient");

const EXPIRATION = config.redisExpiration.default;
const redis = RedisClient.connection;

async function getDocument(character, series) {
  const key = `character-wish-count:${character}:${series}`;

  let value = await redis.get(key);

  if (value === null) {
    // Document not found in cache, fetch from database
    const characterDocument = await CharacterModel.findOne({ character: character, series: series });
    value = redis.set(key, characterDocument.wishCount);
  }

  return value;
}

async function cache(character, series, value) {
  const key = `character-wish-count:${character}:${series}`;
  await redis.set(key, value);
  await redis.expire(key, EXPIRATION);
}

module.exports = {
  getDocument,
  cache,
};
