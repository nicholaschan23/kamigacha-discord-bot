const ModeratorModel = require("@database/mongodb/models/global/moderator");
const redis = require("@database/redis/redisConnect");

/**
 * Checks if a user is a moderator.
 * 
 * This function first attempts to retrieve the moderator status from a Redis cache.
 * If the status is not found in the cache, it queries a MongoDB database to determine
 * if the user is a moderator, updates the cache with the result, and then returns the status.
 * 
 * @param {string} userId - The ID of the user to check.
 * @returns {boolean} Boolean indicating whether the user is a moderator.
 */
async function isUserMod(userId) {
  const key = `moderator:${userId}`;

  // Try to get data from Redis cache
  let value = await redis.get(key);

  // If not in cache, get data from MongoDB
  if (value === null) {
    const moderatorDocument = await ModeratorModel.findOne({ userId: userId });
    value = !!moderatorDocument;
    await redis.set(key, value);
  }
  
  return value;
}

/**
 * Adds a user as a moderator by saving the user information to the database
 * and setting a corresponding key in Redis.
 *
 * @param {string} userId - The ID of the user to be added as a moderator.
 */
async function addUser(userId) {
  const newModerator = new ModeratorModel({
    userId: userId,
  });
  await newModerator.save();
  await redis.set(`moderator:${userId}`, true);
}

/**
 * Removes a user from the moderator list and updates the cache.
 *
 * @param {string} userId - The ID of the user to be removed.
 */
async function removeUser(userId) {
  await ModeratorModel.deleteOne({ userId: userId });
  await redis.set(`moderator:${userId}`, false);
}

module.exports = {
  isUserMod,
  addUser,
  removeUser,
};