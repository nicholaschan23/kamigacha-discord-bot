const { SlashCommandSubcommandBuilder } = require("discord.js");
const WishModel = require("../../../database/mongodb/models/user/wish");

module.exports = {
  category: "public/wish",
  data: new SlashCommandSubcommandBuilder()
    .setName("list")
    .setDescription("View a player's wish list.")
    .addUserOption((option) => option.setName("user").setDescription("Player's wish list to view. Omit to view yours.")),

  async execute(client, interaction) {
    await interaction.deferReply();

    const user = interaction.options.getUser("user") ?? interaction.user;

    const wishDocument = await WishModel().findOne({ userId: user.id });
    if (!wishDocument) {
      return interaction.editReply({ content: "That player does not have a wish list." });
    }

    // Cannot view another player's wishList if it's private
    if (wishDocument.isPrivate && interaction.user.id !== wishDocument.userId) {
      return interaction.editReply({ content: "That player's wish list is private." });
    }

    interaction.editReply({ content: "That card code does not exist.", ephemeral: true });
  },
};
