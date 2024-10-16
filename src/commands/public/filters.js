const { SlashCommandBuilder } = require("discord.js");
const filtersCreate = require("./filters/filters-create");
const filtersDelete = require("./filters/filters-delete");
const filtersEmoji = require("./filters/filters-emoji");
const filtersList = require("./filters/filters-list");
const filtersRename = require("./filters/filters-rename");
const filtersString = require("./filters/filters-string");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder()
    .setName("filters")
    .setDescription("Filters main command.")
    .addSubcommand(filtersCreate.data)
    .addSubcommand(filtersDelete.data)
    .addSubcommand(filtersEmoji.data)
    .addSubcommand(filtersList.data)
    .addSubcommand(filtersRename.data)
    .addSubcommand(filtersString.data),

  async execute(client, interaction) {
    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case "create": {
        await filtersCreate.execute(client, interaction);
        break;
      }
      case "delete": {
        await filtersDelete.execute(client, interaction);
        break;
      }
      case "emoji": {
        await filtersEmoji.execute(client, interaction);
        break;
      }
      case "list": {
        await filtersList.execute(client, interaction);
        break;
      }
      case "rename": {
        await filtersRename.execute(client, interaction);
        break;
      }
      case "string": {
        await filtersString.execute(client, interaction);
        break;
      }
      default: {
        interaction.reply({ content: `There was no execute case for the \`${subcommand}\` subcommand.`, ephemeral: true });
      }
    }
  },
};
