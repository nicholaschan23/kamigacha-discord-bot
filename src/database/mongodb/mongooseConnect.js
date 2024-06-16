const mongoose = require("mongoose");
const utils = require("../../utils");
const logger = new utils.Logger("MongoDB");

module.exports = async (client) => {
  const mongoURI = process.env.DATABASE_URI;

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
};
