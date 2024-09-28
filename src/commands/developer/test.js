const { SlashCommandBuilder } = require("discord.js");
const collection = require("./test/test-collection.js");
const Logger = require("@utils/Logger.js");
const logger = new Logger("test");

module.exports = {
  category: "developer",
  cooldown: 0,
  data: new SlashCommandBuilder().setName("test").setDescription("Test main command.").addSubcommandGroup(collection.data),

  async execute(client, interaction) {
    const subcommandGroup = interaction.options.getSubcommandGroup();
    const subcommand = interaction.options.getSubcommand();
    if (subcommandGroup) {
      switch (subcommandGroup) {
        case "collection": {
          await collection.execute(client, interaction);
          break;
        }
        default: {
          const message = `There was no execute case for the '${subcommandGroup}' subcommand group.`;
          logger.error(message);
          return interaction.reply(message);
        }
      }
    } else if (subcommand) {
      switch (subcommand) {
        // case "shout": {
        //   await shout.execute(client, interaction);
        //   break;
        // }
        default: {
          const message = `There was no execute case for the '${subcommand}' subcommand.`;
          logger.error(message);
          return interaction.reply(message);
        }
      }
    }
  },
};
