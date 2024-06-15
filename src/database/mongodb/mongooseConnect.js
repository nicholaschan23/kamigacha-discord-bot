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
    const userConnection = await createConnection(mongoURI, "user");
    const guildConnection = await createConnection(mongoURI, "guild");
    const globalConnection = await createConnection(mongoURI, "global");

    // // Handle process exit and termination signals
    // const gracefulShutdown = async () => {
    //   try {
    //     await userConnection.close();
    //     await guildConnection.close();
    //     await globalConnection.close();
    //     logger.info(`Connections closed`);
    //     process.exit(0);
    //   } catch (err) {
    //     logger.error(`Error during connection close:`, err);
    //     process.exit(1);
    //   }
    // };

    // // Attach gracefulShutdown to SIGINT and SIGTERM events
    // process.on("SIGINT", async () => {
    //   logger.info("Received SIGINT. Initiating shutdown...");
    //   await gracefulShutdown();
    // });

    // process.on("SIGTERM", async () => {
    //   logger.info("Received SIGTERM. Initiating shutdown...");
    //   await gracefulShutdown();
    // });

    // Assign connections to the client object
    client.userDB = userConnection;
    client.guildDB = guildConnection;
    client.globalDB = globalConnection;
  } catch (error) {
    logger.error(`Connection failed:`, error.stack);
    throw error;
  }
};
