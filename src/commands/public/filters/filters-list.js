const { SlashCommandSubcommandBuilder, EmbedBuilder } = require("discord.js");
const FilterCache = require("@database/redis/cache/collectionFilter");
const ButtonPages = require("@root/src/utils/pages/ButtonPages");
const Logger = require("@utils/Logger");
const { chunkArray, formatFilterListPage } = require("@utils/string/formatPage");

const logger = new Logger("Filters list command");

module.exports = {
  category: "public/filters",
  data: new SlashCommandSubcommandBuilder()
    .setName("list")
    .setDescription("View a player's collection filters.")
    .addUserOption((option) => option.setName("user").setDescription("Player's collection filters to view. Omit to view yours.")),

  async execute(client, interaction) {
    const user = interaction.options.getUser("user") ?? interaction.user;

    try {
      const filterDocument = await FilterCache.getDocument(user.id);
      const total = filterDocument.filterList.length;
      const pages = [];

      if (total === 0) {
        // No filters found
        const embed = new EmbedBuilder()
          .setTitle(`Collection Filters`)
          .setDescription(`Filters created by ${user}`)
          .setFooter({ text: `Showing filters 0-0 (0 total)` });
        pages.push(embed);
      } else {
        // Filters found, chunk and format them
        const chunkSize = 10;
        const cardChunks = chunkArray([...filterDocument.filterList], chunkSize);

        for (let i = 0; i < cardChunks.length; i++) {
          const start = (i * chunkSize + 1).toLocaleString();
          const end = (i * chunkSize + cardChunks[i].length).toLocaleString();
          const embed = new EmbedBuilder()
            .setTitle(`Collection Filters`)
            .setDescription(`Filters created by ${user}\n\n` + formatFilterListPage(cardChunks[i]))
            .setFooter({ text: `Showing filters ${start}-${end} (${total} total)` });
          pages.push(embed);
        }
      }

      // Publish paginated results
      const bp = new ButtonPages(interaction, pages);
      bp.publishPages();
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: "There was an issue viewing those collection tags. Please try again." });
    }
  },
};
