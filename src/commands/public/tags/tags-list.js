const { SlashCommandSubcommandBuilder, EmbedBuilder } = require("discord.js");
const { formatTagListPage, chunkArray } = require("../../../utils/gacha/format");
const TagModel = require("../../../database/mongodb/models/user/tag");
const ButtonPages = require("../../../utils/pages/ButtonPages");
const Logger = require("../../../utils/Logger");
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
      const tagDocument = await TagModel().findOne(
        { userId: user.id } // Filter
      );
      if (!tagDocument) {
        return interaction.reply({ content: `That player does not have any tags.` });
      }

      // Cannot view private tags
      if (tagDocument.isPrivate && user != interaction.user) {
        return interaction.reply({ content: `That player's tags are private.` });
      }

      // Split the list of cards into chunks of 10
      const cardChunks = chunkArray([...tagDocument.tagList], 10);

      // Create page embeds
      let pages = [];
      for (let i = 0; i < cardChunks.length; i++) {
        const embed = new EmbedBuilder()
          .setTitle(`Collection Tags`)
          .setDescription(`Tags created by ${user}\n\n` + formatTagListPage(cardChunks[i]))
          .setFooter({ text: `Page ${i + 1}` });
        pages.push(embed);
      }

      const bp = new ButtonPages(interaction, pages, tagDocument.isPrivate);
      bp.publishPages();
    } catch (error) {
      logger.error(error.stack);
      interaction.reply({ content: "There was an issue viewing those collection tags. Please try again." });
    }
  },
};
