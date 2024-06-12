const { REST, Routes } = require("discord.js");
const config = require("../../config");
const utils = require("../../utils");
const logger = new utils.Logger("Command register");

module.exports = async (client, commands) => {
  // Check if there are any commands to register
  if (!commands || commands.length == 0) return logger.warn("No commands to register");

  const rest = new REST().setToken(process.env.TOKEN);

  // Filter commands into developer and public categories
  const developerCommandData = filterCommands("developer");
  const publicCommandData = filterCommands("public");

  try {
    // Register public commands globally
    logger.info(`Registering ${publicCommandData.length} public command${publicCommandData.length > 1 ? "s" : ""} to the Discord API...`);
    const public_data = await rest.put(Routes.applicationCommands(client.user.id), {
      body: publicCommandData,
    });
    logger.success(`Successfully registered ${public_data.length} public application (/) command${public_data.length > 1 ? "s" : ""}`);

    // Register developer commands to the developer guild
    logger.info(`Registering ${developerCommandData.length} developer command${developerCommandData.length > 1 ? "s" : ""} to the Discord API...`);
    const developer_data = await rest.put(Routes.applicationGuildCommands(client.user.id, config.developer.guildID), {
      body: developerCommandData,
    });
    logger.success(`Successfully registered ${developer_data.length} developer application (/) command${developer_data.length > 1 ? "s" : ""}`);
  } catch (error) {
    logger.error(error);
  }

  /**
   * Filters commands by category and returns their data.
   *
   * @param {string} category - The category to filter by.
   * @returns {Array} - An array of filtered command data.
   */
  function filterCommands(category) {
    return commands.filter((command) => command.category == category).map((command) => command.data);
  }
};
