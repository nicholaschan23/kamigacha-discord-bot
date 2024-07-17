const { SlashCommandBuilder } = require("discord.js");
const wishAdd = require("./wish/wish-add");
const wishRemove = require("./wish/wish-remove");
const wishList = require("./wish/wish-list");
const Logger = require("../../utils/Logger");
const logger = new Logger("Wish command");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder().setName("wish").setDescription("Wish main command.").addSubcommand(wishAdd.data).addSubcommand(wishRemove.data).addSubcommand(wishList.data),

  async execute(client, interaction) {
    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case "add": {
        await wishAdd.execute(client, interaction);
        break;
      }
      case "remove": {
        await wishRemove.execute(client, interaction);
        break;
      }
      case "list": {
        await wishList.execute(client, interaction);
        break;
      }
      default: {
        logger.error(`There was no execute case for the '${subcommand}' subcommand`);
        interaction.reply({ content: `There was no execute case for the \`${subcommand}\` subcommand.`, ephemeral: true });
      }
    }
  },
};
