const { SlashCommandBuilder } = require("discord.js");
const collectionFilter = require("./test/test-collection-filter.js");

module.exports = {
  category: "developer",
  cooldown: 0,
  data: new SlashCommandBuilder().setName("test").setDescription("Test main command.").addSubcommand(collectionFilter.data),

  async execute(client, interaction) {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand) {
      switch (subcommand) {
        case "collection-filter": {
          await collectionFilter.execute(client, interaction);
          break;
        }
        default: {
          interaction.reply(`There was no execute case for the '${subcommand}' subcommand.`);
          return;
        }
      }
    }
  },
};
