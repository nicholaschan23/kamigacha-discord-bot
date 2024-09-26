require('module-alias/register');
const { ClusterManager } = require("discord-hybrid-sharding");
const shutdownManager = require("@utils/shutdownManager");
const redis = require("redis");
const assert = require("assert");
const path = require("path");
const Logger = require("@utils/Logger");
const logger = new Logger("Cluster manager");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, ".env") });
assert(process.env.DISCORD_BOT_TOKEN, "A Discord bot token is required");

// Track shutdown state for cluster respawning
let isShuttingDown = false;
process.on("SIGINT", async () => {
  isShuttingDown = true;
});
process.on("SIGTERM", async () => {
  isShuttingDown = true;
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

  // Create and add reference for the Redis cluster
  const redisCluster = redis.createCluster({
    rootNodes: [
      {
        url: "redis://127.0.0.1:6379",
      },
      {
        url: "redis://127.0.0.1:6380",
      },
      {
        url: "redis://127.0.0.1:6381",
      },
    ],
  });
  redisCluster.on("error", (err) => logger.info(`Redis connection (${cluster.id}) error`, err));
  await redisCluster.connect();
  cluster.redis = redisCluster;

  shutdownManager.register(async () => {
    await redisCluster.quit();
    logger.info(`Redis connection (${cluster.id}) disconnected`);
  });
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
