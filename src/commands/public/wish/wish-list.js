const { SlashCommandSubcommandBuilder, EmbedBuilder } = require("discord.js");
const { chunkArray, formatWishListPage } = require("../../../utils/string/formatPage");
const ButtonPages = require("../../../utils/pages/ButtonPages");
const WishModel = require("../../../database/mongodb/models/user/wish");

module.exports = {
  category: "public/wish",
  data: new SlashCommandSubcommandBuilder()
    .setName("list")
    .setDescription("View a player's wish list.")
    .addUserOption((option) => option.setName("user").setDescription("Player's wish list to view. Omit to view yours.")),

  async execute(client, interaction) {
    const user = interaction.options.getUser("user") ?? interaction.user;

    // Fetch wish document
    const wishDocument = await WishModel().findOne({ userId: user.id });
    if (!wishDocument) {
      return interaction.reply({ content: "That player does not have a wish list.", ephemeral: true });
    }

    // Cannot view another player's wish list if it's private
    if (wishDocument.isPrivate && interaction.user.id !== wishDocument.userId) {
      return interaction.reply({ content: "That player's wish list is private.", ephemeral: true });
    }

    // Split the list of cards into chunks of 10
    const limit = wishDocument.wishListLimit;
    const chunkSize = 10;
    const wishListChunked = chunkArray([...wishDocument.wishList], chunkSize);
    
    // Create page embeds
    const total = wishDocument.wishList.length;
    const pages = []; // Store embeds
    for (let i = 0; i < wishListChunked.length; i++) {
      const start = (i * chunkSize + 1).toLocaleString();
      const end = (i * chunkSize + wishListChunked[i].length).toLocaleString();
      const embed = new EmbedBuilder()
        .setTitle(`Wish list`)
        .setDescription(`Showing wish list of ${user}\n` + `-# Slots available (**${limit - total}**/${limit})\n` + formatWishListPage(wishListChunked[i]))
        .setFooter({ text: `Showing wishes ${start}-${end} (${total} total)` });
      pages.push(embed);
    }

    // Publish wish list
    const bp = new ButtonPages(interaction, pages, wishDocument.isPrivate);
    bp.publishPages();
  },
};
