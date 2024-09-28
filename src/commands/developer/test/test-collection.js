const { SlashCommandSubcommandGroupBuilder } = require("discord.js");
const Logger = require("@utils/Logger");
const filter = require("./collection/test-collection-filter");

const logger = new Logger("Test collection");

module.exports = {
  category: "developer/test",
  data: new SlashCommandSubcommandGroupBuilder().setName("collection").setDescription("Test collection subcommand group.").addSubcommand(filter.data),

  async execute(client, interaction) {
    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case "filter": {
        await filter.execute(client, interaction);
        break;
      }
      default: {
        const message = `There was no execute case for the '${subcommand}' subcommand.`;
        logger.error(message);
        return interaction.reply(message);
      }
    }
  },
};
