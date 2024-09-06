const { ClusterManager } = require("discord-hybrid-sharding");
const { createRedisClient } = require("./src/database/redis/createRedisClient");
const assert = require("assert");
const path = require("path");
const Logger = require("./src/utils/Logger");
const logger = new Logger("Cluster manager");

require("./src/database/redis/createRedisCluster");

require("dotenv").config({ path: path.join(__dirname, ".env") });
assert(process.env.DISCORD_BOT_TOKEN, "A Discord bot token is required");

// IPC listeners
let isShuttingDown = false;
process.on("SIGINT", async () => {
  isShuttingDown = true;
  logger.info("Received SIGINT. Initiating shutdown...");
  process.exit(0);
});
process.on("SIGTERM", async () => {
  isShuttingDown = true;
  logger.info("Received SIGTERM. Initiating shutdown...");
  process.exit(0);
});

const manager = new ClusterManager("./bot.js", {
  totalShards: "auto",
  shardsPerClusters: 2,
  mode: "process",
  token: process.env.DISCORD_BOT_TOKEN,
});

manager.on("clusterCreate", (cluster) => {
  logger.info(`Launched cluster ${cluster.id}`);

  // Create a Redis client per Discord cluster
  const redisClient = createRedisClient(cluster.id);

  // Save Redis client reference for Discord client to use
  cluster.redisClient = redisClient;

  // Check Redis client reference can be accessed by Discord client
  cluster.send({ type: "VERIFY_REDIS" });
});

manager.on("clusterDeath", (cluster) => {
  if (isShuttingDown) {
    logger.info(`Cluster ${cluster.id} has exited during shutdown`);
  } else {
    logger.info(`Cluster ${cluster.id} died unexpectedly. Respawning...`);
    // manager.respawn({ cluster });
  }

  logger.info(`Cluster ${cluster.id} has died. Closing Redis client...`);

  // Close the Redis client when the cluster dies
  if (cluster.redisClient) {
    cluster.redisClient.quit((err) => {
      if (err) {
        logger.error(`Error closing Redis client (Cluster ${cluster.id}):`, err);
      } else {
        logger.info(`Redis client closed (Cluster ${cluster.id})`);
      }
    });
  }
});

manager.on("shardCreate", (shard) => {
  logger.log(`Launched shard ${shard.id}`);

  /**
   * Sends an Inter-Process Communication (IPC) message from the cluster manager to the shard.
   * This is how you pass data, like configuration information or other instructions,
   * between the parent process (the cluster manager) and the child processes (the shards).
   */
  // shard.send({ type: "INIT_REDIS", redisConfig: { url: process.env.REDIS_URL } });
});

manager.spawn({ timeout: -1 });
