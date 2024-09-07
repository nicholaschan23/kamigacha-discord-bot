const { registerShutdownTask } = require("../../utils/initialization/shutdown");
const mongoose = require("mongoose");
const Logger = require("../../utils/Logger");
const logger = new Logger("MongoDB");
const CardModel = require("./models/card/card");

module.exports = async (client) => {
  const mongoURI = process.env.MONGODB_URI;

  const createConnection = (uri, dbName) => {
    return new Promise((resolve, reject) => {
      const connection = mongoose.createConnection(uri, { dbName });

      connection.on("error", (error) => {
        logger.error(`${dbName} database connection error:`, error);
        reject(error);
      });

      connection.once("open", () => {
        logger.success(`Connected to ${dbName} database`);
        resolve(connection);
      });
    });
  };

  try {
    // Create and wait for all database connections concurrently
    const [userConnection, guildConnection, globalConnection, cardConnection] = await Promise.all([createConnection(mongoURI, "user"), createConnection(mongoURI, "guild"), createConnection(mongoURI, "global"), createConnection(mongoURI, "card")]);

    // Assign connections to the client object
    client.userDB = userConnection;
    client.guildDB = guildConnection;
    client.globalDB = globalConnection;
    client.cardDB = cardConnection;
  } catch (error) {
    logger.error(`Connection failed:`, error.stack);
    throw error;
  }

  try {
    client.cardDB.model("card", CardModel().schema);
  } catch (error) {
    logger.error("Failed to register models", error.stack);
    throw error;
  }

  registerShutdownTask(async () => {
    // Close MongoDB connections concurrently
    await Promise.all([client.userDB.close(), client.guildDB.close(), client.globalDB.close(), client.cardDB.close()]);
    await mongoose.disconnect();
    logger.info("Database connections closed");
  });
};
