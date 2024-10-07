const { SlashCommandBuilder } = require("discord.js");
const TradeManager = require("@utils/gacha/TradeManager");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder()
    .setName("trade")
    .setDescription("Trade with another player.")
    .addUserOption((option) => option.setName("user").setDescription("Player you'd like to trade with.").setRequired(true)),
  async execute(client, interaction) {
    const receiver = interaction.options.getUser("user");

    if (receiver.bot) {
      return interaction.reply({ content: "You cannot trade with a bot.", ephemeral: true });
    }

    if (interaction.user.id === receiver.id) {
      return interaction.reply({ content: "You cannot trade with yourself.", ephemeral: true });
    }

    const bp = new TradeManager(interaction, receiver);
    bp.initTrade();
  },
};
