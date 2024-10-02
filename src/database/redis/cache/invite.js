const InviteModel = require("@database/mongodb/models/global/invite");
const RedisClient = require("@database/redis/RedisClient");

const redis = RedisClient.connection;

async function isUserInvited(userId) {
  const key = `invited:${userId}`;

  // Try to get data from Redis cache
  let value = await redis.get(key);

  // If not in cache, get data from MongoDB
  if (value === null) {
    const inviteDocument = await InviteModel.findOne({ receiverUserId: userId });
    value = !!inviteDocument;
    cache(userId, value);
  }
  else {
    value = value === "true";
  }

  return value;
}

async function addInvite(senderUserId, receiverUserId) {
  const newInvite = new InviteModel({
    senderUserId,
    receiverUserId,
  });
  await newInvite.save();
  cache(receiverUserId, true);
}

function cache(userId, value) {
  const key = `invited:${userId}`;
  const value = value.toString();
  redis.set(key, value);
}

module.exports = {
  isUserInvited,
  addInvite,
};
