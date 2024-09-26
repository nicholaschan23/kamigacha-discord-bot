const BlacklistModel = require("@database/mongodb/models/global/blacklist");
const ExtendedClient = require("@client/ExtendedClient");

/**
 * Checks if a user is blacklisted by querying the Redis cache first, and if not found, querying the MongoDB database.
 * If the user is found in the database, the result is cached in Redis.
 *
 * @param {ExtendedClient} client - The client object containing the Redis instance.
 * @param {string} userId - The ID of the user to check.
 * @returns {Promise<Object|boolean>} Returns the blacklist document if the user is blacklisted, otherwise returns false.
 */
async function isUserBlacklisted(client, userId) {
  const redis = client.redis;
  const key = `blacklisted:${userId}`;

  let value = await redis.get(key);

  switch (value) {
    case null: {
      const blacklistDocument = await BlacklistModel.findOne({ blacklistUserId: userId });
      if (blacklistDocument) {
        value = JSON.stringify(blacklistDocument);
      } else {
        value = false;
      }
      await redis.set(key, value);
      break;
    }
    case false: {
      break;
    }
    default: {
      value = JSON.parse(value);
      break;
    }
  }

  return value;
}

async function getReason(client, userId) {
  const response = await isUserBlacklisted(client, userId);
  if (response === false) return null;
  return response.reason;
}

async function addUser(client, userId, moderatorUserId, reason) {
  const model = new BlacklistModel({
    blacklistUserId: userId,
    moderatorUserId: moderatorUserId,
    reason: reason,
  });
  await model.save();

  const redis = client.redis;
  await redis.set(`blacklisted:${userId}`, JSON.stringify(model));
}

async function removeUser(client, userId) {
  await BlacklistModel.deleteOne({ blacklistUserId: userId });

  const redis = client.cluster.redis;
  await redis.set(`blacklisted:${userId}`, false);
}

module.exports = {
  isUserBlacklisted,
  getReason,
  addUser,
  removeUser,
};
