const InviteModel = require("@database/mongodb/models/global/invite");
const RedisClient = require("@database/redis/RedisClient");

const KEY = "invited";
const redis = RedisClient.connection;

async function isUserInvited(userId) {
  let value = await redis.hget(KEY, userId);

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
  redis.hset(KEY, userId, value.toString());
}

module.exports = {
  isUserInvited,
  addInvite,
};
