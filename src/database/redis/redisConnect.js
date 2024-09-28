const Redis = require("ioredis");
const shutdownManager = require("@utils/shutdownManager");
const Logger = require("@utils/Logger");
const logger = new Logger("Redis");

// Establish connection to Redis cluster
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
redisCluster.on("error", (err) => logger.info(`Redis connection error`, err));
redisCluster.on("connect", () => logger.info(`Redis connection established`));
redisCluster.on("ready", () => logger.info(`Redis connection ready`));
redisCluster.on("close", () => logger.info(`Redis connection closed`));
redisCluster.on("reconnecting", () => logger.info(`Redis connection reconnecting`));
redisCluster.on("end", () => logger.info(`Redis connection ended`));

// Registers a shutdown handler to gracefully disconnect from the Redis cluster
shutdownManager.register(async () => {
  await redisCluster.quit();
});

module.exports = redisCluster;
