const { ClusterManager } = require("discord-hybrid-sharding");
const assert = require("assert");
const path = require("path");
const Logger = require("./src/utils/Logger");
const logger = new Logger("Cluster manager");

require("dotenv").config({ path: path.join(__dirname, ".env") });
assert(process.env.DISCORD_BOT_TOKEN, "A Discord bot token is required");

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
manager.on("clusterCreate", (cluster) => logger.info(`Launched cluster ${cluster.id}`));
manager.on("clusterDeath", (cluster) => {
  if (isShuttingDown) {
    logger.info(`Cluster ${cluster.id} has exited during shutdown`);
  } else {
    logger.info(`Cluster ${cluster.id} died unexpectedly. Respawning...`);
    // manager.respawn({ cluster });
  }
});

manager.spawn({ timeout: -1 });
