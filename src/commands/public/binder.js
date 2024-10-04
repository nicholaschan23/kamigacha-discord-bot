const { SlashCommandBuilder } = require("discord.js");
const binderAdd = require("./binder/binder-add");
const binderCreate = require("./binder/binder-create");
const binderDelete = require("./binder/binder-delete");
const binderList = require("./binder/binder-list");
const binderRename = require("./binder/binder-rename");
const binderView = require("./binder/binder-view");
const Logger = require("@utils/Logger");

const logger = new Logger("Tags command");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder()
    .setName("binder")
    .setDescription("Binder main command.")
    .addSubcommand(binderCreate.data)
    .addSubcommand(binderDelete.data)
    .addSubcommand(binderList.data)
    .addSubcommand(binderRename.data)
    .addSubcommand(binderView.data),

  async execute(client, interaction) {
    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case "add": {
        await binderAdd.execute(client, interaction);
        break;
      }
      case "create": {
        await binderCreate.execute(client, interaction);
        break;
      }
      case "delete": {
        await binderDelete.execute(client, interaction);
        break;
      }
      case "list": {
        await binderList.execute(client, interaction);
        break;
      }
      case "rename": {
        await binderRename.execute(client, interaction);
        break;
      }
      case "view": {
        await binderView.execute(client, interaction);
        break;
      }
      default: {
        interaction.reply({ content: `There was no execute case for the \`${subcommand}\` subcommand.`, ephemeral: true });
      }
    }
  },
};
