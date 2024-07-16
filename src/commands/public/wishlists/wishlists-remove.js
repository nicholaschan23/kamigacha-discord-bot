const { SlashCommandSubcommandBuilder } = require("discord.js");
const WishlistModel = require("../../../database/mongodb/models/user/wishlist");
const Logger = require("../../../utils/Logger");
const logger = new Logger("Filters create command");

module.exports = {
  category: "public/wishlists",
  data: new SlashCommandSubcommandBuilder()
    .setName("remove")
    .setDescription("Remove a character from your wishlist.")
    .addStringOption((option) => option.setName("character").setDescription("Search by character and series name.")),

  async execute(client, interaction) {
    await interaction.deferReply();

    try {
      // Find the wishlist document for the user
      const wishlistDocument = await WishlistModel().findOneAndUpdate(
        { userId: interaction.user.id }, // Filter
        { $setOnInsert: { userId: interaction.user.id } }, // Update
        { new: true, upsert: true }
      );

      // Check if wishlist limit is reached
      if (!wishlistDocument) {
        return interaction.editReply({ content: `Your wishlist is empty.` });
      }

      // Button pages for wishlist

      // Select menu to choose wishlist to remove

      // Save document
      await WishlistModel().findOneAndUpdate(
        { character: interaction.user.id }, // Filter
        {
          $pull: {
            wishlist: {
              $each: [{ character: character, series: series }],
            },
          },
        } // Update
      );

      interaction.editReply({ content: `Successfully removed **${character}** from ${series} your wishlist!` });
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: "There was an issue removing from your wishlist. Please try again." });
    }
  },
};
