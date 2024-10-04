const { SlashCommandSubcommandGroupBuilder } = require("discord.js");
const binderRemoveCards = require("./remove/binder-remove-cards");

module.exports = {
  category: "public/binder",
  data: new SlashCommandSubcommandGroupBuilder().setName("remove").setDescription("Binder remove subcommand group.").addSubcommand(binderRemoveCards.data),

  async execute(client, interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "cards": {
        await binderRemoveCards.execute(client, interaction);
        break;
      }
      default: {
        interaction.reply({ content: `There was no execute case for the '${subcommand}' subcommand.`, ephemeral: true });
      }
    }
  },
};
