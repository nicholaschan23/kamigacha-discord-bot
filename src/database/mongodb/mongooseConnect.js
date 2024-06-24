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
    // Create and wait for database connections with a timeout
    const userConnection = await createConnection(mongoURI, "user");
    const guildConnection = await createConnection(mongoURI, "guild");
    const globalConnection = await createConnection(mongoURI, "global");
    const cardConnection = await createConnection(mongoURI, "card");

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
    client.cardDB.model("card", CardModel(client).schema);
  } catch (error) {
    logger.error("Failed to register models", error.stack);
    throw error;
  }
};
