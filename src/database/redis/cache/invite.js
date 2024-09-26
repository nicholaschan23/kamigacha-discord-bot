const InviteModel = require("@database/mongodb/models/global/invite");

async function isUserInvited(client, userId) {
  const redis = client.redis;
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

async function addInvite(client, senderUserId, receiverUserId) {
  const redis = client.cluster.redis;

  const newInvite = new InviteModel({
    senderUserId,
    receiverUserId,
  });
  await newInvite.save();

  // Add data to Redis cache
  await redis.set(`invited:${receiverUserId}`, true);
}

module.exports = {
  isUserInvited,
  addInvite,
};
