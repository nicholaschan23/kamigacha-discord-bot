const { SlashCommandSubcommandBuilder } = require("discord.js");
const WishlistModel = require("../../../database/mongodb/models/user/wishlist");
const WishlistRemovePages = require("../../../utils/pages/WishlistRemovePages");
const Logger = require("../../../utils/Logger");
const logger = new Logger("Wishlists remove command");

module.exports = {
  category: "public/wishlists",
  data: new SlashCommandSubcommandBuilder().setName("remove").setDescription("Remove a character from your wishlist."),

  async execute(client, interaction) {
    let bp;
    try {
      // Find the wishlist document for the user
      const wishlistDocument = await WishlistModel().findOneAndUpdate(
        { userId: interaction.user.id }, // Filter
        { $setOnInsert: { userId: interaction.user.id } }, // Update
        { new: true, upsert: true }
      );

      // Wishlist is empty
      if (wishlistDocument.wishlist.length === 0) {
        return interaction.reply({ content: `Your wishlist is empty.`, ephemeral: true });
      }

      // Pages with select menu to choose wishlist to remove
      bp = new WishlistRemovePages(interaction, wishlistDocument);
    } catch (error) {
      logger.error(error.stack);
      interaction.reply({ content: "There was an issue removing from your wishlist. Please try again.", ephemeral: true });
    }
    bp.createPages();
    bp.publishPages();
  },
};
