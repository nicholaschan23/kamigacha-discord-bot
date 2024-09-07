const Logger = require("../Logger");
const logger = new Logger("Shutdown");

// Track shutdown tasks
const shutdownTasks = [];

// Register a shutdown task
function registerShutdownTask(task) {
  shutdownTasks.push(task);
  console.log(shutdownTasks.length);
}

// Perform all shutdown tasks
async function shutdown(type) {
  logger.info(`Starting shutdown process... (${type})`);
  console.log(shutdownTasks.length);

  // Run all registered shutdown tasks
  const tasks = shutdownTasks.map((task) => task());

  try {
    await Promise.all(tasks);
    logger.info(`Shutdown complete (${type})`);
    process.exit(0);
  } catch (err) {
    logger.error("Error during shutdown task:", err);
  }
  process.exit(1);
}

module.exports = { registerShutdownTask, shutdown };
