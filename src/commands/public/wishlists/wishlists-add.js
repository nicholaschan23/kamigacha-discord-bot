const { SlashCommandSubcommandBuilder } = require("discord.js");
const WishlistAddPages = require("../../../utils/pages/WishlistAddPages");
const WishlistModel = require("../../../database/mongodb/models/user/wishlist");
const { lookup } = require("../../../utils/gacha/lookupCharacter")
const Logger = require("../../../utils/Logger");
const logger = new Logger("Filters create command");

module.exports = {
  category: "public/wishlists",
  data: new SlashCommandSubcommandBuilder()
    .setName("add")
    .setDescription("Add a character to your wishlist.")
    .addStringOption((option) => option.setName("character").setDescription("Search by character and series name.").setRequired(true)),

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
      if (wishlistDocument.wishlist.length >= wishlistDocument.wishlistLimit) {
        return interaction.editReply({ content: `You've reached your wishlist limit of ${wishlistDocument.wishlistLimit}.` });
      }

      // Button pages for lookup search
      const character = interaction.options.getString("character");
      const results = lookup(character, client.jsonSearches);

      // No results
      if (results.length == 0) {
        return interaction.reply("That character could not be found. It may not exist, or you may have misspelled their name.");
      }

      // Select menu to choose wishlist to add
      const bp = new WishlistAddPages(interaction, results);
      bp.publishPages();

      // Save document
      await WishlistModel().findOneAndUpdate(
        { character: interaction.user.id }, // Filter
        {
          $push: {
            wishlist: {
              $each: [{ character: character, series: series }],
              $sort: { series: 1, character: 1 },
            },
          },
        } // Update
      );

      interaction.editReply({ content: `Successfully added **${character}** from ${series} to your wishlist!` });
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: "There was an issue adding to your wishlist. Please try again." });
    }
  },
};
