const path = require("path");
const { getJsFiles } = require("@utils/fileSystem");
const Logger = require("@utils/Logger");
const logger = new Logger("Event loader");
const eventsPath = path.join(__dirname, "../events/");

module.exports = (client) => {
  const events = getJsFiles(eventsPath);

  for (const element of events) {
    const elementLoaded = require(eventsPath + element);
    if (!elementLoaded.type) {
      logger.error(`Failed to load ${element} type`);
      continue;
    }
    if (!elementLoaded.call) {
      logger.error(`Failed to load ${element} call`);
      continue;
    }

    switch (elementLoaded.type) {
      case "on": {
        logger.success(`Successfully loaded ${element} event`);
        client.on(elementLoaded.event, (...args) => elementLoaded.call(client, ...args));
        break;
      }
      case "once": {
        logger.success(`Successfully loaded ${element} event`);
        client.once(elementLoaded.event, (...args) => elementLoaded.call(client, ...args));
        break;
      }
      default:
        return logger.error(`Type of ${element} is not allowed!`);
    }
  }
  return logger.info("Events loaded");
};
