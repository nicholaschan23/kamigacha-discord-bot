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
    await redis.set(key, JSON.stringify(filterDocument));
    return filterDocument;
  }

  return JSON.parse(value);
}

async function addFilter(userId, emoji, label, filter) {
  const filterDocument = await FilterModel.findOneAndUpdate(
    { userId: userId, "filterList.label": { $ne: label } },
    {
      $push: {
        filterList: {
          $each: [{ emoji: emoji, label: label, filter: filter }],
          $sort: { label: 1 },
        },
      },
    },
    { new: true }
  );
  await cache(userId, filterDocument);
}

async function deleteFilter(userId, label) {
  const filterDocument = await FilterModel.findOneAndUpdate(
    { userId: userId, "filterList.label": label },
    { $pull: { filterList: { label: label } } },
    { new: true }
  );
  await cache(userId, filterDocument);
}

async function updateEmoji(userId, label, emoji) {
  const filterDocument = await FilterModel.findOneAndUpdate(
    { userId: userId, "filterList.label": label },
    { $set: { "filterList.$.emoji": emoji } },
    { new: true }
  );
  await cache(userId, filterDocument);
}

async function updateFilterString(userId, label, string) {
  const filterDocument = await FilterModel.findOneAndUpdate(
    { userId: userId, "filterList.label": label },
    { $set: { "filterList.$.filter": string } },
    { new: true }
  );
  await cache(userId, filterDocument);
}

async function cache(userId, object) {
  const key = `collection-filter:${userId}`;
  const value = JSON.stringify(object);
  await redis.set(key, value);
  await redis.expire(key, EXPIRATION);
}

module.exports = {
  getDocument,
  addFilter,
  deleteFilter,
  updateEmoji,
  updateFilterString,
};
