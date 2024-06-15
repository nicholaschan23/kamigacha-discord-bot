const { ClusterManager } = require("discord-hybrid-sharding");
const assert = require("assert");
const path = require("path");
const utils = require("./src/utils");
const logger = new utils.Logger("Cluster manager");

require("dotenv").config({ path: path.join(__dirname, ".env") });
assert(process.env.TOKEN, "A Discord bot token is required");

let isShuttingDown = false;
const manager = new ClusterManager("./bot.js", {
  totalShards: "auto",
  shardsPerClusters: 2,
  mode: "process",
  token: process.env.TOKEN,
});

process.on("SIGINT", async () => {
  isShuttingDown = true;
  logger.info("Received SIGINT. Initiating shutdown...");
  // await manager.shutdown();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  isShuttingDown = true;
  logger.info("Received SIGTERM. Initiating shutdown...");
  // await manager.shutdown();
  process.exit(0);
});

manager.on("clusterCreate", (cluster) => logger.info(`Launched cluster ${cluster.id}`));

manager.on("clusterDeath", (cluster) => {
  if (isShuttingDown) {
    console.log(`Cluster ${cluster.id} has exited during shutdown.`);
  } else {
    console.log(`Cluster ${cluster.id} died unexpectedly. Respawning...`);
    // manager.respawn({ cluster });
  }
});

manager.spawn({ timeout: -1 });
