const { SlashCommandBuilder } = require("discord.js");
const TradeManager = require("../../utils/gacha/TradeManager");
const InventoryModel = require("../../database/mongodb/models/user/inventory");

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

    // const inventoryDocument = await InventoryModel.findOneAndUpdate({ userId: interaction.user.id }, { $setOnInsert: { userId: interaction.user.id } }, { new: true, upsert: true });

    // if (inventoryDocument.inventory.size === 0) {
    //   return interaction.reply({ content: "Your inventory is empty.", ephemeral: true });
    // } else {
    // }
  },
};
