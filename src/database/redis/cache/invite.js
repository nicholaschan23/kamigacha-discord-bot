const config = require("@config");
const InviteModel = require("@database/mongodb/models/global/invite");
const RedisClient = require("@database/redis/RedisClient");

const EXPIRATION = config.redisExpiration.default;
const redis = RedisClient.connection;

async function isUserInvited(userId) {
  const key = `invited:${userId}`;

  // Try to get data from Redis cache
  let value = await redis.get(key);

  // If not in cache, get data from MongoDB
  if (value === null) {
    const inviteDocument = await InviteModel.findOne({ receiverUserId: userId });
    value = !!inviteDocument;
    await redis.set(key, value);
    await redis.expire(key, EXPIRATION);
  }
  
  return value;
}

async function addInvite(senderUserId, receiverUserId) {
  const newInvite = new InviteModel({
    senderUserId,
    receiverUserId,
  });
  await newInvite.save();

  const key = `invited:${receiverUserId}`;
  await redis.set(key, true);
  await redis.expire(key, EXPIRATION);
}

module.exports = {
  isUserInvited,
  addInvite,
};
