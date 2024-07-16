const { SlashCommandSubcommandBuilder, EmbedBuilder } = require("discord.js");
const { formatFilterListPage, chunkArray } = require("../../../utils/gacha/format");
const FilterModel = require("../../../database/mongodb/models/user/filter");
const ButtonPages = require("../../../utils/pages/ButtonPages");
const Logger = require("../../../utils/Logger");
const logger = new Logger("Filters create command");

module.exports = {
  category: "public/filters",
  data: new SlashCommandSubcommandBuilder()
    .setName("list")
    .setDescription("View a player's collection filters.")
    .addUserOption((option) => option.setName("user").setDescription("Player's collection filters to view. Omit to view yours.")),

  async execute(client, interaction) {
    const user = interaction.options.getUser("user") ?? interaction.user;

    try {
      const filterDocument = await FilterModel().findOne(
        { userId: user.id } // Filter
      );
      if (!filterDocument) {
        return interaction.reply({ content: `That player does not have any filters.` });
      }

      // Cannot view private filters
      if (filterDocument.isPrivate && user != interaction.user) {
        return interaction.reply({ content: `That player's filters are private.` });
      }

      // Split the list of cards into chunks of 10
      const cardChunks = chunkArray([...filterDocument.filterList], 10);

      // Create page embeds
      let pages = [];
      for (let i = 0; i < cardChunks.length; i++) {
        const embed = new EmbedBuilder()
          .setTitle(`Collection Filters`)
          .setDescription(`Filters created by ${user}\n\n` + formatFilterListPage(cardChunks[i]))
          .setFooter({ text: `Page ${i + 1}` });
        pages.push(embed);
      }

      const bp = new ButtonPages(interaction, pages, filterDocument.isPrivate);
      bp.publishPages();
    } catch (error) {
      logger.error(error.stack);
      interaction.reply({ content: "There was an issue viewing those collection tags. Please try again." });
    }
  },
};
