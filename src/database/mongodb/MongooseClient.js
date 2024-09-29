const path = require("path");
const mongoose = require("mongoose");
const { getJsFiles } = require("@utils/fileSystem");
const Logger = require("@utils/Logger");
const ShutdownManager = require("@utils/ShutdownManager");

const logger = new Logger("MongoDB");

class MongooseClient {
  constructor() {
    this.connection = null;
  }

  // Establish connection to MongoDB
  async connect(gracefulShutdown = true) {
    const mongoURI = process.env.MONGODB_URI;

    try {
      // Connect to MongoDB
      this.connection = await mongoose.connect(mongoURI, {
        dbName: "global", // Specify the default database name
      });
      logger.success("Connected to MongoDB");

      if (gracefulShutdown) {
        ShutdownManager.register(async () => {
          await this.disconnect();
        });
      }

      // Register models
      const modelsPath = path.join(__dirname, "models");
      this.registerModels(modelsPath);
    } catch (error) {
      logger.error("Connection failed:", error.stack);
      throw error;
    }
  }

  // Disconnect from MongoDB
  async disconnect() {
    try {
      await mongoose.disconnect();
      logger.success("Disconnected from MongoDB");
    } catch (error) {
      logger.error("Disconnection failed:", error.stack);
      throw error;
    }
  }

  /**
   * Registers all Mongoose models found in the specified directory.
   * @param {String} modelsPath - The path to the directory containing the model files.
   */
  registerModels(modelsPath) {
    const jsFiles = getJsFiles(modelsPath);

    jsFiles.forEach((file) => {
      const filePath = path.join(modelsPath, file);
      const model = require(filePath);
      const modelName = path.basename(file, ".js");
      mongoose.model(modelName, model.schema);
    });
  }
}

// Export a singleton instance of MongooseClient
module.exports = new MongooseClient();
