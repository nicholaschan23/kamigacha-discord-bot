const { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { getJsFiles, abbrevCmdPath } = require("@utils/fileSystem");
const Logger = require("@utils/Logger");
const logger = new Logger("Command loader");
const commandsPath = path.join(__dirname, "../commands/");

module.exports = (client) => {
  // Initialize an empty stack to store commands
  const stack = [];

  // Read command categories from the commands directory
  const commandCategories = fs.readdirSync(commandsPath);

  // Loop through each category to load commands
  commandCategories.forEach((category) => {
    const commandPath = path.join(commandsPath, category);
    const commandFiles = getJsFiles(commandPath);

    // Loop through each command file in the category
    commandFiles.forEach((file) => {
      const filePath = path.join(commandPath, file);
      const command = require(filePath);
      const filePathAbbrev = abbrevCmdPath(filePath);

      // Validate and register the command
      if (validateCommand(SlashCommandBuilder, command, filePathAbbrev)) {
        client.commands.set(command.data.name, command);
        stack.push(command);
        logger.success(`Successfully loaded ${filePathAbbrev} command`);

        // Load subcommand groups or subcommands for the command
        loadSubcommandsAndGroups(path.join(commandPath, command.data.name));
      }
    });
  });

  logger.info("Commands loaded");
  return stack;

  /**
   * Validates a command to ensure it meets the necessary criteria.
   * @param {Function} type - The expected type of the command (SlashCommandBuilder, etc.).
   * @param {Object} command - The command object to validate.
   * @param {string} filePathAbbrev - The abbreviated file path of the command.
   * @returns {boolean} True if the command is valid, false otherwise.
   */
  function validateCommand(type, command, filePathAbbrev) {
    if (!command) {
      logger.error(`${filePathAbbrev} not valid`);
      return false;
    }
    if (typeof command.execute !== "function") {
      logger.error(`${filePathAbbrev} does not have the execute function`);
      return false;
    }
    if (!(command.data instanceof type)) {
      logger.error(`${filePathAbbrev} does not have the ${type} instance`);
      return false;
    }
    if (client.commands.has(command.data.name)) {
      logger.warn(`Two or more commands share the name ${command.data.name}`);
      return false;
    }
    return true;
  }

  /**
   * Loads subcommands and subcommand groups for a given command.
   * @param {string} subcommandPath - The path to the subcommands directory.
   */
  function loadSubcommandsAndGroups(subcommandPath) {
    if (fs.existsSync(subcommandPath) && fs.statSync(subcommandPath).isDirectory()) {
      const subcommandFiles = getJsFiles(subcommandPath);

      // Loop through each subcommand and subcommand group file
      subcommandFiles.forEach((file) => {
        const filePath = path.join(subcommandPath, file);
        const subcommand = require(filePath);
        if (subcommand.data instanceof SlashCommandSubcommandBuilder) {
          const filePathAbbrev = abbrevCmdPath(filePath);

          // Validate and log the subcommand
          if (validateCommand(SlashCommandSubcommandBuilder, subcommand, filePathAbbrev)) {
            logger.success(`Successfully loaded ${filePathAbbrev} subcommand`);
          }
        } else if (subcommand.data instanceof SlashCommandSubcommandGroupBuilder) {
          loadGroupSubcommands(path.join(subcommandPath, subcommand.data.name));
        }
      });
    }
  }

  /**
   * Loads subcommands for a given subcommand group.
   * @param {string} subcommandGroupPath - The path to the subcommand groups directory.
   */
  function loadGroupSubcommands(subcommandGroupPath) {
    if (fs.existsSync(subcommandGroupPath) && fs.statSync(subcommandGroupPath).isDirectory()) {
      const subcommandGroupFiles = getJsFiles(subcommandGroupPath);

      // Loop through each subcommand file of the subgroup
      subcommandGroupFiles.forEach((file) => {
        const filePath = path.join(subcommandGroupPath, file);
        const subcommandGroup = require(filePath);
        const filePathAbbrev = abbrevCmdPath(filePath);

        // Validate and log the subcommand
        if (validateCommand(SlashCommandSubcommandBuilder, subcommandGroup, filePathAbbrev)) {
          logger.success(`Successfully loaded ${filePathAbbrev} subcommand`);
        }
      });
    }
  }
};
