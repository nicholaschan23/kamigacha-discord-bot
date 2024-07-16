const { SlashCommandBuilder } = require("discord.js");
const WishlistModel = require("../../database/mongodb/models/user/wishlist");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder()
    .setName("wishlist")
    .setDescription("View a player's wishlist.")
    .addUserOption((option) => option.setName("user").setDescription("Player's wishlist to view. Omit to view yours.")),

  async execute(client, interaction) {
    await interaction.deferReply();

    const user = interaction.options.getUser("user") ?? interaction.user;

    const wishlistDocument = await WishlistModel().findOne({ userId: user.id });
    if (!wishlistDocument) {
      return interaction.editReply({ content: "That player does not have a wishlist." });
    }

    // Cannot view another player's wishlist if it's private
    if (wishlistDocument.isPrivate && interaction.user.id !== wishlistDocument.userId) {
      return interaction.editReply({ content: "That player's wishlist is private." });
    }

    interaction.editReply({ content: "That card code does not exist.", ephemeral: true });
  },
};
