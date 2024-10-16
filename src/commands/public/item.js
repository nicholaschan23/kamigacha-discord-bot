const { SlashCommandBuilder } = require("discord.js");
const itemInfo = require("./item/item-info");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder().setName("item").setDescription("Item main command.").addSubcommand(itemInfo.data),

  async execute(client, interaction) {
    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case "info": {
        await itemInfo.execute(client, interaction);
        break;
      }
      default: {
        interaction.reply({ content: `There was no execute case for the \`${subcommand}\` subcommand.`, ephemeral: true });
      }
    }
  },
};
