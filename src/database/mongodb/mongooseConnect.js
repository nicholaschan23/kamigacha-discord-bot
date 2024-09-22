const { registerShutdownTask } = require("../../utils/initialization/shutdown");
const mongoose = require("mongoose");
const Logger = require("../../utils/Logger");
const logger = new Logger("MongoDB");
const path = require("path");
const { getJsFiles } = require("../../utils/fileSystem");

module.exports = async (client) => {
  const mongoURI = process.env.MONGODB_URI;

  try {
    // const [userDB, guildDB, globalDB, assetDB] = await Promise.all([
    //   mongoose.createConnection(mongoURI, { dbName: "user" }),
    //   mongoose.createConnection(mongoURI, { dbName: "guild" }),
    //   mongoose.createConnection(mongoURI, { dbName: "global" }),
    //   mongoose.createConnection(mongoURI, { dbName: "asset" }),
    // ]);


    // Connect to MongoDB
    await mongoose.connect(mongoURI, {
      dbName: "global", // Specify the default database name
    });
    logger.success("Connected to MongoDB");

    // Register models
    const modelsPath = path.join(__dirname, "models");
    registerModels(modelsPath);
  } catch (error) {
    logger.error("Connection failed:", error.stack);
    throw error;
  }

  registerShutdownTask(async () => {
    // Close MongoDB connections concurrently
    await Promise.all([client.userDB.close(), client.guildDB.close(), client.globalDB.close(), client.cardDB.close()]);
    await mongoose.disconnect();
    logger.info("Database connections closed");
  });
};

/**
 * Registers all Mongoose models found in the specified directory.
 * @param {String} modelsPath - The path to the directory containing the model files.
 */
function registerModels(modelsPath) {
  const jsFiles = getJsFiles(modelsPath);

  jsFiles.forEach((file) => {
    const filePath = path.join(modelsPath, file);
    const model = require(filePath);
    const modelName = path.basename(file, ".js");
    mongoose.model(modelName, model.schema);
  });
}
