require("module-alias/register");
const assert = require("assert");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, ".env") });
assert(process.env.DISCORD_BOT_TOKEN, "A Discord bot token is required");

const { ClusterManager } = require("discord-hybrid-sharding");
const config = require("@config");
const MongooseClient = require("@database/mongodb/MongooseClient");
const RedisClient = require("@database/redis/RedisClient");
const { downloadFiles } = require("@database/aws/downloadFiles");
const { getFormattedNamesMap } = require("@database/aws/preprocessing/formattedNames");
const { initCardModel } = require("@database/aws/preprocessing/cardModel");
const { initCharacterModel } = require("@database/aws/preprocessing/characterModel");
const { initCharacterDB } = require("@database/mongodb/initialization/characterDB");
const { initSearchModel } = require("@database/aws/preprocessing/searchModel");
const Logger = require("@utils/Logger");

const logger = new Logger("Cluster manager");

async function fetchData() {
  await MongooseClient.connect(false);
  await RedisClient.connect(false);

  // Download images from AWS S3 Bucket
  await downloadFiles("customisations/boarders", config.IMAGES_PATH);

  // Preprocess card data from AWS S3 Bucket
  const { object: cardModel, keys: seriesKeys } = await initCardModel();
  const { object: characterModel, keys: characterKeys } = await initCharacterModel(cardModel, seriesKeys);
  const characterNameMap = await getFormattedNamesMap(characterKeys, config.CHARACTER_NAME_MAP_PATH);
  const seriesNameMap = await getFormattedNamesMap(seriesKeys, config.SERIES_NAME_MAP_PATH);
  const { object: searchModel, keys: tokenKeys } = await initSearchModel(characterModel, characterKeys);

  // Store models and maps in Redis
  const MapCache = require("@database/redis/cache/map");
  await MapCache.storeModelAsMap("card-model", cardModel); // card-model-map
  await MapCache.storeModelAsMap("character-model", characterModel); // character-model-map
  await MapCache.storeModelAsMap("search-model", searchModel); // search-model-map
  await MapCache.storeModelAsMap("character-name", characterNameMap); // character-name-map
  await MapCache.storeModelAsMap("series-name", seriesNameMap); // series-name-map

  // Update MongoDB character data
  await initCharacterDB(characterModel, characterKeys);

  await MongooseClient.disconnect();
  await RedisClient.quit();
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
    await fetchData();
    setupClusterManager();
  } catch (error) {
    logger.error("Initialization failed", error.stack);
    process.exit(1);
  }
})();
