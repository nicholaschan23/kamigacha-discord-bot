const { SlashCommandSubcommandBuilder } = require("discord.js");
const WishCache = require("@database/redis/cache/characterWish");
const Logger = require("@utils/Logger");
const WishListRemovePages = require("@root/src/utils/pages/wishList/WishListRemovePages");

const logger = new Logger("Wish remove command");

module.exports = {
  category: "public/wish",
  data: new SlashCommandSubcommandBuilder().setName("remove").setDescription("Remove a character from your wish list."),

  async execute(client, interaction) {
    try {
      // Find the wish list document for the user
      const wishDocument = await WishCache.getDocument(interaction.user.id);

      // WishList is empty
      if (wishDocument.wishList.length === 0) {
        interaction.reply({ content: `Your wish list is empty.`, ephemeral: true });
        return;
      }

      // Pages with select menu to choose wishList to remove
      const bp = new WishListRemovePages(interaction, wishDocument);
      bp.createPages();
      bp.publishPages();
    } catch (error) {
      logger.error(error.stack);
      interaction.reply({ content: "There was an issue removing from your wish list. Please try again.", ephemeral: true });
    }
  },
};
