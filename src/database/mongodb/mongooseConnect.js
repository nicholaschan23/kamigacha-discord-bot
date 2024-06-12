const mongoose = require("mongoose");
const utils = require("../../utils");
const logger = new utils.Logger("MongoDB");

module.exports = async (client) => {
  const mongoURI = process.env.DATABASE_URI;
  try {
    // Set up event listeners before connecting
    mongoose.connection.on("error", (error) => {
      logger.error(`Connection error:`, error);
    });

    mongoose.connection.once("open", () => {
      logger.success(`Connected`);
    });

    // Connect to MongoDB
    await mongoose.connect(mongoURI);

    // Handle process exit and termination signals
    const gracefulShutdown = async () => {
      try {
        await mongoose.connection.close();
        logger.info(`Connection closed`);
        process.exit(0);
      } catch (err) {
        logger.error(`Error during connection close:`, err);
        process.exit(1);
      }
    };

    process.on("SIGINT", gracefulShutdown).on("SIGTERM", gracefulShutdown);

    client.mongo = mongoose.connection;
  } catch (error) {
    logger.error(`Connection failed:`, error);
    throw error;
  }
};
