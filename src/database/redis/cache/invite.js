const InviteModel = require("@database/mongodb/models/global/invite");
const redis = require("@database/redis/redisConnect");

async function isUserInvited(userId) {
  const key = `invited:${userId}`;

  // Try to get data from Redis cache
  let value = await redis.get(key);

  // If not in cache, get data from MongoDB
  if (value === null) {
    const inviteDocument = await InviteModel.findOne({ receiverUserId: userId });
    value = !!inviteDocument;
    await redis.set(key, value);
  }
  
  return value;
}

async function addInvite(senderUserId, receiverUserId) {
  const newInvite = new InviteModel({
    senderUserId,
    receiverUserId,
  });
  await newInvite.save();
  await redis.set(`invited:${receiverUserId}`, true);
}

module.exports = {
  isUserInvited,
  addInvite,
};
