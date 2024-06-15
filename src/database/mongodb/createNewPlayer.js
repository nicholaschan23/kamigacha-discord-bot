const CollectionModel = require("./models/user/collection");
const InventoryModel = require("./models/user/inventory");
const PityModel = require("./models/user/pity");
const SetsModel = require("../mongodb/models/user/sets");
const SettingsModel = require("../mongodb/models/user/settings");
const StatsModel = require("./models/user/stats");

// Create an instance of all these database collections for the new user
module.exports = async (client, userID) => {
  const collection = new (CollectionModel(client))({ userID: userID });
  await collection.save();
  // const inventory = new InventoryModel(client)({ userID: userID });
  // await inventory.save();
  const pity = new PityModel(client)({ userID: userID });
  await pity.save();
  // const sets = new SetsModel(client)({ userID: userID });
  // await sets.save();
  // const settings = new SettingsModel(client)({ userID: userID });
  // await settings.save();
  // const stats = new StatsModel(client)({ userID: userID });
  // await stats.save();
};
