/**
 * Establishes a connection to a Redis cluster and assigns it to the client.
 * Registers a shutdown handler to gracefully disconnect from the Redis cluster.
 */

const Redis = require("ioredis");
const shutdownManager = require("@utils/shutdownManager");
const Logger = require("@utils/Logger");
const logger = new Logger("Redis");

module.exports = async (client) => {
  const redisCluster = new Redis.Cluster(
    [
      {
        host: "127.0.0.1",
        port: 6379,
      },
      {
        host: "127.0.0.1",
        port: 6380,
      },
      {
        host: "127.0.0.1",
        port: 6381,
      },
    ],
    {
      redisOptions: {
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000);
          logger.info(`Retrying connection in ${delay}ms (attempt ${times})`);
          return delay;
        },
      },
    }
  );

  // Handlers
  redisCluster.on("error", (err) => logger.info(`Redis connection (${client.cluster.id}) error`, err));
  redisCluster.on("connect", () => logger.info(`Redis connection (${client.cluster.id}) established`));
  redisCluster.on("ready", () => logger.info(`Redis connection (${client.cluster.id}) ready`));
  redisCluster.on("close", () => logger.info(`Redis connection (${client.cluster.id}) closed`));
  redisCluster.on("reconnecting", () => logger.info(`Redis connection (${client.cluster.id}) reconnecting`));
  redisCluster.on("end", () => logger.info(`Redis connection (${client.cluster.id}) ended`));

  shutdownManager.register(async () => {
    await redisCluster.quit();
  });

  client.redis = redisCluster;
};
