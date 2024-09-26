/**
 * Redis Cluster:
 * - A Redis cluster consists of multiple Redis nodes (servers) working together to provide distributed caching.
 * - Nodes in the cluster are primarily master nodes, with optional replica nodes for redundancy. In this setup, we use only master nodes for simplicity.
 * - Redis clients connect to the cluster via a single URL, which points to one of the cluster nodes.
 */

require('module-alias/register');
const path = require("path");
const { execSync, spawn } = require("child_process");

const shutdownManager = require("@utils/shutdownManager");
const Logger = require("@utils/Logger");
const logger = new Logger("Redis cluster");

const redisPorts = [6379, 6380, 6381];

function createRedisCluster() {
  shutdownRedisServers();
  initRedisServers();
  initRedisCluster();
}

function initRedisServers() {
  redisPorts.forEach((port) => {
    const configFilePath = path.join(__dirname, "config", `redis-${port}.conf`);
    try {
      const redisProcess = spawn("redis-server", [configFilePath]);
      redisProcess.on("error", (err) => {
        logger.error(`Failed to start Redis server on port ${port}: ${err.message}`);
      });
      redisProcess.stdout.on("data", (data) => {
        logger.info(`Redis server on port ${port}: ${data}`);
      });
      redisProcess.stderr.on("data", (data) => {
        logger.error(`Redis server on port ${port} error: ${data}`);
      });
      logger.success(`Started Redis server on port ${port} using config file ${configFilePath}`);
    } catch (error) {
      logger.error(`Error spawning Redis server on port ${port}: ${error.message}`);
    }
  });

  shutdownManager.register(() => shutdownRedisServers());
}

function initRedisCluster() {
  // Wait a bit to ensure Redis servers are fully started
  setTimeout(() => {
    try {
      // Run the Redis cluster creation command using execSync
      const createClusterCommand = `redis-cli --cluster create 127.0.0.1:6379 127.0.0.1:6380 127.0.0.1:6381 --cluster-replicas 0`;
      execSync(createClusterCommand, { stdio: "inherit" });

      logger.info("Redis cluster created successfully.");
    } catch (error) {
      logger.error(`Failed to create Redis cluster: ${error.message}`);
      process.exit(1); // Exit if the cluster creation fails
    }
  }, 3000); // Give the Redis servers time to start up before creating the cluster
}

// Function to gracefully shut down Redis servers
async function shutdownRedisServers() {
  logger.info("Shutting down Redis servers...");

  for (const port of redisPorts) {
    try {
      execSync(`redis-cli -p ${port} shutdown`);
      logger.success(`Gracefully shut down Redis server on port ${port}`);
    } catch (error) {
      logger.error(`Failed to shut down Redis server on port ${port}: ${error.message}`);
    }
  }
}

createRedisCluster();
