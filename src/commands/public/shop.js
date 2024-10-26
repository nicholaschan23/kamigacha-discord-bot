const { SlashCommandBuilder } = require("discord.js");
const shopPacks = require("./shop/shop-packs");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder().setName("shop").setDescription("Shop main command.").addSubcommand(shopPacks.data),

  async execute(client, interaction) {
    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case "packs": {
        await shopPacks.execute(client, interaction);
        break;
      }
      default: {
        interaction.reply({ content: `There was no execute case for the \`${subcommand}\` subcommand.`, ephemeral: true });
      }
    }
  },
};
