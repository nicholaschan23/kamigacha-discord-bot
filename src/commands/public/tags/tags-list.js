const { SlashCommandSubcommandBuilder, EmbedBuilder } = require("discord.js");
const { chunkArray, formatTagListPage } = require("@utils/string/formatPage");
const TagCache = require("@database/redis/cache/collectionTag");
const ButtonPages = require("@root/src/pagination/ButtonPages");
const Logger = require("@utils/Logger");
const logger = new Logger("Tags create command");

module.exports = {
  category: "public/tags",
  data: new SlashCommandSubcommandBuilder()
    .setName("list")
    .setDescription("View a player's collection tags.")
    .addUserOption((option) => option.setName("user").setDescription("Player's collection tags to view. Omit to view yours.")),

  async execute(client, interaction) {
    const user = interaction.options.getUser("user") || interaction.user;

    try {
      const tagDocument = await TagCache.getDocument(user.id);

      // Cannot view private tags
      if (tagDocument.isPrivate && user != interaction.user) {
        interaction.reply({ content: `That player's tags are private.` });
        return;
      }

      // Create page embeds
      const total = tagDocument.tagList.length;
      const pages = [];

      if (total === 0) {
        const embed = new EmbedBuilder()
          .setTitle(`Collection Tags`)
          .setDescription(`Tags created by ${user}`)
          .setFooter({ text: `Showing tags 0-0 (0 total)` });
        pages.push(embed);
      } else {
        // Split the list of cards into chunks of 10
        const chunkSize = 10;
        const cardChunks = chunkArray([...tagDocument.tagList], chunkSize);

        for (let i = 0; i < cardChunks.length; i++) {
          const start = (i * chunkSize + 1).toLocaleString();
          const end = (i * chunkSize + cardChunks[i].length).toLocaleString();
          const embed = new EmbedBuilder()
            .setTitle(`Collection Tags`)
            .setDescription(`Tags created by ${user}\n\n` + formatTagListPage(cardChunks[i]))
            .setFooter({ text: `Showing tags ${start}-${end} (${total} total)` });
          pages.push(embed);
        }
      }

      const bp = new ButtonPages(interaction, pages, tagDocument.isPrivate);
      bp.publishPages();
    } catch (error) {
      logger.error(error.stack);
      interaction.reply({ content: "There was an issue viewing those collection tags. Please try again." });
    }
  },
};
