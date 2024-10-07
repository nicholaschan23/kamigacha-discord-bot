const Redis = require("ioredis");
const Logger = require("@utils/Logger");
const ShutdownManager = require("@utils/ShutdownManager");

const logger = new Logger("Redis");

class RedisClient {
  constructor() {
    this._connection = null;
  }

  get connection() {
    return this._connection;
  }

  // Establish connection to Redis cluster
  async connect(gracefulShutdown = true) {
    if (this._connection) {
      logger.info("Redis connection already established");
      return this._connection;
    }

    this._connection = new Redis.Cluster(
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

    if (gracefulShutdown) {
      ShutdownManager.register(async () => {
        await this.quit();
      });
    }

    // Handlers
    this._connection.on("error", (err) => {
      throw new Error(err);
    });
    this._connection.on("connect", () => logger.info(`Redis connection established`));
    this._connection.on("ready", () => logger.info(`Redis connection ready`));
    this._connection.on("close", () => logger.info(`Redis connection closed`));
    this._connection.on("reconnecting", () => logger.info(`Redis connection reconnecting`));
    this._connection.on("end", () => logger.info(`Redis connection ended`));

    return this._connection;
  }

  // Quit the Redis connection
  async quit() {
    if (!this._connection) return;
    await this._connection.quit();
    this._connection = null;
  }
}

// Export a singleton instance of RedisClient
module.exports = new RedisClient();
