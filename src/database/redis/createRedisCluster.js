/**
 * Redis Cluster:
 * - A Redis cluster consists of multiple Redis nodes (servers) working together to provide distributed caching.
 * - Nodes in the cluster are primarily master nodes, with optional replica nodes for redundancy. In this setup, we use only master nodes for simplicity.
 * - Redis clients connect to the cluster via a single URL, which points to one of the cluster nodes.
 */

const { execSync } = require("child_process");
const path = require("path");
const Logger = require("../../utils/Logger");
const logger = new Logger("Redis cluster");

// Define the addresses of your Redis nodes
const nodes = ["localhost:6379", "localhost:6380", "localhost:6381"];

// Start Redis nodes with the configuration file
nodes.forEach((node, index) => {
  const port = 6379 + index;
  const redisConfPath = path.join(__dirname, "config", `redis-${port}.conf`);
  try {
    execSync(`redis-server ${redisConfPath} --port ${port}`, { stdio: "inherit" });
    logger.log(`Started Redis server on port ${port} using config file ${redisConfPath}`);
  } catch (error) {
    logger.error(`Failed to start Redis server on port ${port}: ${error.message}`);
    process.exit(1); // Exit if a Redis server fails to start
  }
});

// Create Redis cluster
try {
  execSync(`redis-cli --cluster create ${nodes.join(" ")} --cluster-replicas 0`, { stdio: "inherit" });
  logger.log("Redis cluster created successfully.");
} catch (error) {
  logger.error(`Failed to create Redis cluster: ${error.message}`);
  process.exit(1); // Exit if the Redis cluster creation fails
}
