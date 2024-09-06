/**
 * Redis Client:
 * - Each Discord cluster creates and manages a single Redis client.
 * - A cluster in Discord's sharding terminology typically handles multiple shards.
 * - Each shard represents a segment of the bot's workload and is responsible for handling events for a subset of Discord servers (guilds).
 * - The Redis client is created when a cluster is initialized. It connects to a Redis cluster, which is responsible for caching and managing state across all the shards within that cluster.
 * - The Redis client is associated with the cluster, not the individual shards, to reduce the number of Redis connections and optimize resource usage.
 * - Each shard within the cluster holds a reference to the Redis client. This allows every shard to interact with the Redis cluster without creating its own Redis client, ensuring efficient use of resources.
 * - The Redis cluster URL is provided via an environment variable (`REDIS_CLUSTER_URL`) and is used to connect all Redis clients to the same Redis cluster. This centralizes caching and state management across the entire bot.
 * - When a cluster shuts down (e.g., due to a restart or scaling down), the Redis client should be properly destroyed to free up resources and avoid connection leaks.
 */

const redis = require("redis");
const Logger = require("../../utils/Logger");
const logger = new Logger("Redis client");

function createRedisClient(clusterId) {
  const client = redis.createClient({ url: process.env.REDIS_CLUSTER_URL });

  client.on("error", (err) => {
    logger.error(`[Cluster ${clusterId})]`, err);
  });

  client.on("connect", () => {
    logger.log(`[Cluster ${clusterId})] Connected to Redis`);
  });

  return client;
}

module.exports = { createRedisClient };
