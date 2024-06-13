const mongoose = require("mongoose");
const config = require("../../config");
const utils = require("../../utils");
const logger = new utils.Logger("MongoDB");

module.exports = async (client) => {
  const mongoURI = process.env.DATABASE_URI;
  const connectionTimeout = config.databaseConnectionTimeout;

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

  const withTimeout = (promise, timeout) => {
    return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("Connection timed out")), timeout))]);
  };

  try {
    // Create and wait for database connections with a timeout
    const userConnection = await withTimeout(createConnection(mongoURI, "user"), connectionTimeout);
    const guildConnection = await withTimeout(createConnection(mongoURI, "guild"), connectionTimeout);
    const globalConnection = await withTimeout(createConnection(mongoURI, "global"), connectionTimeout);

    // Handle process exit and termination signals
    const gracefulShutdown = async () => {
      try {
        await userConnection.close();
        await guildConnection.close();
        await globalConnection.close();
        logger.info(`Connections closed`);
        process.exit(0);
      } catch (err) {
        logger.error(`Error during connection close:`, err);
        process.exit(1);
      }
    };

    process.on("SIGINT", gracefulShutdown).on("SIGTERM", gracefulShutdown);

    // Assign connections to the client object
    client.userDB = userConnection;
    client.guildDB = guildConnection;
    client.globalDB = globalConnection;
  } catch (error) {
    logger.error(`Connection failed:`, error);
    throw error;
  }
};
