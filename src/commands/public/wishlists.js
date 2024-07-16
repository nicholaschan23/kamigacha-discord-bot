const { SlashCommandBuilder } = require("discord.js");
const wishlistsAdd = require("./wishlists/wishlists-add");
const wishlistsRemove = require("./wishlists/wishlists-remove");
const Logger = require("../../utils/Logger");
const logger = new Logger("Wishlists command");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder().setName("wishlists").setDescription("Wishlists main command.").addSubcommand(wishlistsAdd.data).addSubcommand(wishlistsRemove.data),

  async execute(client, interaction) {
    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case "add": {
        await wishlistsAdd.execute(client, interaction);
        break;
      }
      case "remove": {
        await wishlistsRemove.execute(client, interaction);
        break;
      }
      default: {
        logger.error(`There was no execute case for the '${subcommand}' subcommand`);
        interaction.reply({ content: `There was no execute case for the \`${subcommand}\` subcommand.`, ephemeral: true });
      }
    }
  },
};
