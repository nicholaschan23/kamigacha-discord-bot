const { registerShutdownTask, shutdown } = require("./src/utils/initialization/shutdown");
const { ClusterManager } = require("discord-hybrid-sharding");
const { createRedisClient } = require("./src/database/redis/createRedisClient");
const assert = require("assert");
const path = require("path");
const Logger = require("./src/utils/Logger");
const logger = new Logger("Cluster manager");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, ".env") });
assert(process.env.DISCORD_BOT_TOKEN, "A Discord bot token is required");

// Track shutdown state for cluster respawning
let isShuttingDown = false;
process.on("SIGINT", async () => {
  isShuttingDown = true;
  await shutdown("SIGINT");
});
process.on("SIGTERM", async () => {
  isShuttingDown = true;
  await shutdown("SIGTERM");
});

// Initialize ClusterManager
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

  // Create and add reference for the cluster's Redis client
  const redisClient = createRedisClient(cluster.id);
  await redisClient.connect();
  cluster.redisClient = redisClient;

  // Handle shutdown of Redis clients
  registerShutdownTask(async () => {
    await redisClient.quit();
  });
  // cluster.send({ type: "VERIFY_REDIS" });
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
