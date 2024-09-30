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
    await redis.set(key, JSON.stringify(tagDocument));
    return tagDocument;
  }

  return JSON.parse(value);
}

async function addTag(userId, tag, emoji) {
  const tagDocument = await FilterModel.findOneAndUpdate(
    { userId: userId, "tagList.tag": { $ne: tag } },
    {
      $push: {
        tagList: {
          $each: [{ tag: tag, emoji: emoji }],
          $sort: { tag: 1 },
        },
      },
    },
    { new: true }
  );
  await cache(userId, tagDocument);
}

async function deleteTag(userId, tag) {
  const tagDocument = await TagModel.findOneAndUpdate({ userId: userId, "tagList.tag": tag }, { $pull: { tagList: { tag: tag } } }, { new: true });
  await cache(userId, tagDocument);
}

async function updateEmoji(userId, tag, emoji) {
  const tagDocument = await TagModel.findOneAndUpdate({ userId: userId, "tagList.tag": tag }, { $set: { "tagList.$.emoji": emoji } }, { new: true });
  await cache(userId, tagDocument);
}

async function updateFilterString(userId, label, string) {
  const tagDocument = await FilterModel.findOneAndUpdate(
    { userId: userId, "filterList.label": label },
    { $set: { "filterList.$.filter": string } },
    { new: true }
  );
  await cache(userId, tagDocument);
}

async function cache(userId, object) {
  const key = `collection-tag:${userId}`;
  const value = JSON.stringify(object);
  await redis.set(key, value);
  await redis.expire(key, EXPIRATION);
}

module.exports = {
  getDocument,
  addTag,
  deleteTag,
  cache,
};
