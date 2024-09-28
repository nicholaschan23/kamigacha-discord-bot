const handlers = [];

/**
 * Registers a shutdown handler function.
 *
 * @param {Function} handler - The function to be called during shutdown.
 * @throws {TypeError} Throws an error if the handler is not a function.
 */
function register(handler) {
  if (typeof handler === "function") {
    handlers.push(handler);
  } else {
    throw new TypeError("Handler must be a function");
  }
}

/**
 * Gracefully shuts down the application by executing all registered handlers.
 *
 * This function iterates over an array of handlers and awaits their execution.
 * Once all handlers have been executed, the process exits with a status code of 0.
 *
 * @returns {Promise<void>} A promise that resolves when all handlers have been executed and the process has exited.
 */
async function shutdown() {
  for (const handler of handlers) {
    await handler();
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

module.exports = { register };
