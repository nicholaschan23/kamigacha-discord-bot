const { SlashCommandSubcommandGroupBuilder } = require("discord.js");
const binderAddCard = require("./add/binder-add-card");
const binderAddCards = require("./add/binder-add-cards");

module.exports = {
  category: "public/binder",
  data: new SlashCommandSubcommandGroupBuilder()
    .setName("add")
    .setDescription("Binder add subcommand group.")
    .addSubcommand(binderAddCard.data)
    .addSubcommand(binderAddCards.data),

  async execute(client, interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "card": {
        await binderAddCard.execute(client, interaction);
        break;
      }
      case "cards": {
        await binderAddCards.execute(client, interaction);
        break;
      }
      default: {
        interaction.reply({ content: `There was no execute case for the '${subcommand}' subcommand.`, ephemeral: true });
      }
    }
  },
};
