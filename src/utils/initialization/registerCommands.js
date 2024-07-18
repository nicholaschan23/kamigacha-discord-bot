const { REST, Routes } = require("discord.js");
const config = require("../../config");
const Logger = require("../Logger");
const logger = new Logger("Command register");

module.exports = async (client, commands) => {
  /**
   * Filters commands by category.
   *
   * @param {String} category - The category to filter by.
   * @returns {Array} Filtered command data.
   */
  function filterCommands(category) {
    return commands.filter((command) => command.category == category).map((command) => command.data);
  }

  // Check if there are any commands to register
  if (!commands || commands.length == 0) return logger.warn("No commands to register");

  const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN);

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
    const developer_data = await rest.put(Routes.applicationGuildCommands(client.user.id, config.developer.guildId), {
      body: developerCommandData,
    });
    logger.success(`Successfully registered ${developer_data.length} developer application (/) command${developer_data.length > 1 ? "s" : ""}`);
  } catch (error) {
    logger.error(error);
  }
};
