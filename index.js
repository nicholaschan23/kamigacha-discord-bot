require("module-alias/register");
const assert = require("assert");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, ".env") });
assert(process.env.DISCORD_BOT_TOKEN, "A Discord bot token is required");

const { ClusterManager } = require("discord-hybrid-sharding");
const config = require("@config");
const { downloadFiles } = require("@database/aws/downloadFiles");
const mongooseConnect = require("@database/mongodb/mongooseConnect");
const { initCharacterNameMap, initSeriesNameMap } = require("@database/aws/preprocessing/formattedNames");
const { initSearchModel } = require("@database/aws/preprocessing/searchModel");
const { initCharacterDB } = require("@database/mongodb/initialization/characterDB");
const { initCardModel } = require("@database/aws/preprocessing/cardModel");
const { initCharacterModel } = require("@database/aws/preprocessing/characterModel");
const Logger = require("@utils/Logger");
const logger = new Logger("Cluster manager");

async function initDatabase() {
  // Connect to MongoDB for cloud database
  await mongooseConnect();

  // Connect to Redis for local caching
  await new Promise((resolve, reject) => {
    const redisCluster = require("@database/redis/redisConnect");
    redisCluster.once("ready", resolve);
    redisCluster.once("error", reject);
  });
}

async function fetchData() {
  // Download images from AWS S3 Bucket
  await downloadFiles("customisations/boarders", config.IMAGES_PATH);

  // Preprocess card data from AWS S3 Bucket
  const { object: cardModel, keys: seriesKeys } = await initCardModel();
  const { object: characterModel, keys: characterKeys } = await initCharacterModel(cardModel, seriesKeys);
  await initCharacterNameMap(characterKeys, config.CHARACTER_NAME_MAP_PATH);
  await initSeriesNameMap(seriesKeys, config.SERIES_NAME_MAP_PATH);
  await initSearchModel(characterModel, characterKeys);

  // Update MongoDB character data
  await initCharacterDB(characterModel, characterKeys);
}

function setupClusterManager() {
  // Track shutdown state for cluster respawning
  let isShuttingDown = false;
  process.on("SIGINT", async () => {
    isShuttingDown = true;
  });
  process.on("SIGTERM", async () => {
    isShuttingDown = true;
  });

  // init ClusterManager
  const manager = new ClusterManager("./bot.js", {
    totalShards: "auto",
    shardsPerClusters: 2,
    mode: "process",
    token: process.env.DISCORD_BOT_TOKEN,
    respawn: false, // Ensure clusters do not respawn automatically
  });

  // Handle cluster creation
  manager.on("clusterCreate", async (cluster) => {
    if (isShuttingDown) return; // Skip creation if shutting down
  });

  // Handle unexpected cluster death
  manager.on("clusterDeath", async (cluster) => {
    if (isShuttingDown) {
      logger.info(`Cluster ${cluster.id} has exited during shutdown`);
    } else {
      // Respawn cluster if not shutting down
      logger.info(`Cluster ${cluster.id} died unexpectedly. Respawning...`);
      manager.respawn({ cluster });
    }
  });

  // Setup signal handlers and spawn clusters
  manager.spawn({ timeout: -1 });
}

(async () => {
  try {
    await initDatabase();
    await fetchData();
    setupClusterManager();
  } catch (error) {
    logger.error("Initialization failed", error);
    process.exit(1);
  }
})();
