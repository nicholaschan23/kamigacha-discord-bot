const { SlashCommandSubcommandBuilder } = require("discord.js");
const WishModel = require("../../../database/mongodb/models/user/wish");
const WishListRemovePages = require("../../../utils/pages/WishListRemovePages");
const Logger = require("../../../utils/Logger");
const logger = new Logger("Wish remove command");

module.exports = {
  category: "public/wish",
  data: new SlashCommandSubcommandBuilder().setName("remove").setDescription("Remove a character from your wish list."),

  async execute(client, interaction) {
    let bp;
    try {
      // Find the wishList document for the user
      const wishDocument = await WishModel().findOneAndUpdate(
        { userId: interaction.user.id }, // Filter
        { $setOnInsert: { userId: interaction.user.id } }, // Update
        { new: true, upsert: true }
      );

      // WishList is empty
      if (wishDocument.wishList.length === 0) {
        return interaction.reply({ content: `Your wish list is empty.`, ephemeral: true });
      }

      // Pages with select menu to choose wishList to remove
      bp = new WishListRemovePages(interaction, wishDocument);
    } catch (error) {
      logger.error(error.stack);
      interaction.reply({ content: "There was an issue removing from your wish list. Please try again.", ephemeral: true });
    }
    bp.createPages();
    bp.publishPages();
  },
};
