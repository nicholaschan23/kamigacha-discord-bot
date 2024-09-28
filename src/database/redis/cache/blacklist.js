const BlacklistModel = require("@database/mongodb/models/global/blacklist");
const redis = require("@database/redis/redisConnect");

/**
 * Checks if a user is blacklisted by querying the Redis cache first, and if not found, querying the MongoDB database.
 * If the user is found in the database, the result is cached in Redis.
 *
 * @param {string} userId - The ID of the user to check.
 * @returns {Promise<Object|boolean>} Returns the blacklist document if the user is blacklisted, otherwise returns false.
 */
async function isUserBlacklisted(userId) {
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

/**
 * Adds a user to the blacklist.
 *
 * @param {string} blacklistUserId - The ID of the user to be blacklisted.
 * @param {string} moderatorUserId - The ID of the moderator who is blacklisting the user.
 * @param {string} reason - The reason for blacklisting the user.
 */
async function addUser(blacklistUserId, moderatorUserId, reason) {
  const model = new BlacklistModel({
    blacklistUserId: blacklistUserId,
    moderatorUserId: moderatorUserId,
    reason: reason,
  });
  await model.save();
  await redis.set(`blacklisted:${userId}`, JSON.stringify(model));
}

/**
 * Removes a user from the blacklist.
 *
 * This function deletes the user from the BlacklistModel and updates the Redis cache
 * to indicate that the user is no longer blacklisted.
 *
 * @param {string} userId - The ID of the user to be removed from the blacklist.
 */
async function removeUser(userId) {
  await BlacklistModel.deleteOne({ blacklistUserId: userId });
  await redis.set(`blacklisted:${userId}`, false);
}

module.exports = {
  isUserBlacklisted,
  getReason,
  addUser,
  removeUser,
};
