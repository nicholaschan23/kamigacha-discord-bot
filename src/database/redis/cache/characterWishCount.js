const CharacterModel = require("@database/mongodb/models/global/character");
const RedisClient = require("@database/redis/RedisClient");

const redis = RedisClient.connection;

async function getWishCount(character, series) {
  const key = `character-wish-count:${character}:${series}`;

  let value = await redis.get(key);

  if (value === null) {
    // Document not found in cache, fetch from database
    const wishDocument = await CharacterModel.findOne({ character: character, series: series }).select("wishCount").lean().exec();
    if (wishDocument) {
      const wishCount = wishDocument.wishCount;
      value = wishCount;
      cache(character, series, wishCount);
    } else {
      value = -1;
    }
  } else {
    value = parseInt(value, 10);
  }

  return value;
}

function cache(character, series, value) {
  const key = `character-wish-count:${character}:${series}`;
  redis.set(key, value.toString());
}

module.exports = {
  getWishCount,
  cache,
};
