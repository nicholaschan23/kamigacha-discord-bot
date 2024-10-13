const { SlashCommandSubcommandBuilder } = require("discord.js");
const WishCache = require("@database/redis/cache/characterWish");
const Logger = require("@utils/Logger");
const { lookup } = require("@utils/gacha/lookup");
const WishListAddPages = require("@root/src/utils/pages/wishList/WishListAddPages");

const logger = new Logger("Wish add command");

module.exports = {
  category: "public/wish",
  data: new SlashCommandSubcommandBuilder()
    .setName("add")
    .setDescription("Add a character to your wish list.")
    .addStringOption((option) => option.setName("character").setDescription("Search by character and series name.").setRequired(true)),

  async execute(client, interaction) {
    try {
      // Find the wish list document for the user
      const wishDocument = await WishCache.getDocument(interaction.user.id);

      // Check if wish list limit is reached
      if (wishDocument.wishList.length >= wishDocument.wishListLimit) {
        interaction.reply({ content: `You've reached your wish list limit of ${wishDocument.wishListLimit}.` });
        return;
      }

      // Button pages for lookup search
      const character = interaction.options.getString("character");
      const [characterResults, seriesResults] = await lookup(character);

      // No results
      if (characterResults.length == 0) {
        interaction.reply("That character could not be found. It may not exist, or you may have misspelled their name.");
        return;
      }

      // Pages with select menu to choose wish to add
      const bp = new WishListAddPages(interaction, characterResults);
      await bp.createPages();
      bp.publishPages();
    } catch (error) {
      logger.error(error.stack);
      interaction.reply({ content: "There was an issue adding to your wish list. Please try again.", ephemeral: true });
    }
  },
};
