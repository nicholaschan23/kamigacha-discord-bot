const { SlashCommandSubcommandBuilder } = require("discord.js");
const WishModel = require("../../../database/mongodb/models/user/wish");
const WishListAddPages = require("../../../utils/pages/WishListAddPages");
const { lookup } = require("../../../utils/gacha/lookupCharacter");
const Logger = require("../../../utils/Logger");
const logger = new Logger("Wish add command");

module.exports = {
  category: "public/wish",
  data: new SlashCommandSubcommandBuilder()
    .setName("add")
    .setDescription("Add a character to your wish list.")
    .addStringOption((option) => option.setName("character").setDescription("Search by character and series name.").setRequired(true)),

  async execute(client, interaction) {
    let bp;
    try {
      // Find the wishList document for the user
      const wishDocument = await WishModel().findOneAndUpdate(
        { userId: interaction.user.id }, // Filter
        { $setOnInsert: { userId: interaction.user.id } }, // Update
        { new: true, upsert: true }
      );

      // Check if wishList limit is reached
      if (wishDocument.wishList.length >= wishDocument.wishListLimit) {
        return interaction.editReply({ content: `You've reached your wish list limit of ${wishDocument.wishListLimit}.` });
      }

      // Button pages for lookup search
      const character = interaction.options.getString("character");
      const results = lookup(character, client.jsonSearches);

      // No results
      if (results.length == 0) {
        return interaction.reply("That character could not be found. It may not exist, or you may have misspelled their name.");
      }

      // Pages with select menu to choose wishList to add
      bp = new WishListAddPages(interaction, results);
    } catch (error) {
      logger.error(error.stack);
      interaction.reply({ content: "There was an issue adding to your wish list. Please try again.", ephemeral: true });
    }
    bp.createPages();
    bp.publishPages();
  },
};
