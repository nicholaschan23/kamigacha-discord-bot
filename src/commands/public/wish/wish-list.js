const { SlashCommandSubcommandBuilder, EmbedBuilder } = require("discord.js");
const WishCache = require("@database/redis/cache/characterWish");
const ButtonPages = require("@root/src/utils/pages/ButtonPages");
const { chunkArray, formatWishListPage } = require("@utils/string/formatPage");

module.exports = {
  category: "public/wish",
  data: new SlashCommandSubcommandBuilder()
    .setName("list")
    .setDescription("View a player's wish list.")
    .addUserOption((option) => option.setName("user").setDescription("Player's wish list to view. Omit to view yours.")),

  async execute(client, interaction) {
    const user = interaction.options.getUser("user") ?? interaction.user;

    await interaction.deferReply();

    // Fetch wish document
    const wishDocument = await WishCache.getDocument(user.id);

    // Cannot view another player's wish list if it's private
    if (wishDocument.isPrivate && interaction.user.id !== wishDocument.userId) {
      interaction.editReply({ content: "That player's wish list is private.", ephemeral: true });
      return;
    }

    const limit = wishDocument.wishListLimit;
    const total = wishDocument.wishList.length;
    const pages = []; // Store embeds

    // Create page embeds
    if (total === 0) {
      const embed = new EmbedBuilder()
        .setTitle(`Wish List`)
        .setDescription(`Showing wish list of ${user}\n` + `-# Slots available (**${limit}**/${limit})`)
        .setFooter({ text: `Showing wishes 0-0 (${total} total)` });
      pages.push(embed);
    } else {
      // Split the list of cards into chunks of 10
      const chunkSize = 10;
      const wishListChunked = chunkArray([...wishDocument.wishList], chunkSize);

      for (let i = 0; i < wishListChunked.length; i++) {
        const start = (i * chunkSize + 1).toLocaleString();
        const end = (i * chunkSize + wishListChunked[i].length).toLocaleString();
        const formattedPage = await formatWishListPage(wishListChunked[i]);
        const embed = new EmbedBuilder()
          .setTitle(`Wish List`)
          .setDescription(`Showing wish list of ${user}\n` + `-# Slots available (**${limit - total}**/${limit})\n` + formattedPage)
          .setFooter({ text: `Showing wishes ${start}-${end} (${total} total)` });
        pages.push(embed);
      }
    }

    // Publish wish list
    const bp = new ButtonPages(interaction, pages, wishDocument.isPrivate);
    bp.publishPages(true);
  },
};
