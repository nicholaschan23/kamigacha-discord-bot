const { SlashCommandBuilder } = require("discord.js");
const tagsCreate = require("./tags/tags-create");
const tagsDelete = require("./tags/tags-delete");
const tagsEmoji = require("./tags/tags-emoji");
const tagsList = require("./tags/tags-list");
const tagsRename = require("./tags/tags-rename");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder()
    .setName("tags")
    .setDescription("Tags main command.")
    .addSubcommand(tagsCreate.data)
    .addSubcommand(tagsDelete.data)
    .addSubcommand(tagsEmoji.data)
    .addSubcommand(tagsList.data)
    .addSubcommand(tagsRename.data),

  async execute(client, interaction) {
    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case "create": {
        await tagsCreate.execute(client, interaction);
        break;
      }
      case "delete": {
        await tagsDelete.execute(client, interaction);
        break;
      }
      case "emoji": {
        await tagsEmoji.execute(client, interaction);
        break;
      }
      case "list": {
        await tagsList.execute(client, interaction);
        break;
      }
      case "rename": {
        await tagsRename.execute(client, interaction);
        break;
      }
      default: {
        interaction.reply({ content: `There was no execute case for the \`${subcommand}\` subcommand.`, ephemeral: true });
      }
    }
  },
};
