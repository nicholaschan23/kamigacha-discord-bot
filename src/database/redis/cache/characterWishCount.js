const CharacterModel = require("@database/mongodb/models/global/character");
const RedisClient = require("@database/redis/RedisClient");

const KEY = `character-wish-counts`;
const redis = RedisClient.connection;

async function getWishCount(character, series) {
  const field = `${character}:${series}`;

  let value = await redis.hget(KEY, field);

  if (value === null) {
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

async function getWishCountsForSeries(series) {
  const pattern = `*:${series}`;
  let totalWishCount = 0;

  let cursor = "0";
  do {
    const [newCursor, results] = await redis.hscan(KEY, cursor, "MATCH", pattern);
    cursor = newCursor;

    for (let i = 0; i < results.length; i += 2) {
      const field = results[i];
      const value = parseInt(results[i + 1], 10);
      totalWishCount += value;
    }
  } while (cursor !== "0");

  return totalWishCount;
}

function cache(character, series, value) {
  const field = `${character}:${series}`;
  redis.hset(KEY, field, value.toString());
}

module.exports = {
  getWishCount,
  getWishCountsForSeries,
  cache,
};
