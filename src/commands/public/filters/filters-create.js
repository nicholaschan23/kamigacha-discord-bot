const { SlashCommandSubcommandBuilder } = require("discord.js");
const FilterCache = require("@database/redis/cache/collectionFilter");
const Logger = require("@utils/Logger");
const { capitalizeFirstLetter } = require("@utils/string/format");
const { isOneEmoji, isValidFilter, isValidFilterLabel } = require("@utils/string/validation");

const logger = new Logger("Filters create command");

module.exports = {
  category: "public/filters",
  data: new SlashCommandSubcommandBuilder()
    .setName("create")
    .setDescription("Create a collection filter.")
    .addStringOption((option) => option.setName("filter").setDescription("Filters string to apply to collection.").setRequired(true))
    .addStringOption((option) => option.setName("label").setDescription("Name to associate with this filter.").setRequired(true))
    .addStringOption((option) => option.setName("emoji").setDescription("Emoji to associate with this filter.").setRequired(true)),

  async execute(client, interaction) {
    const filter = interaction.options.getString("filter").toLowerCase().replace(",", "");
    if (!isValidFilter(filter)) {
      interaction.reply({ content: `Please input a valid filter string. Refer to \`/help filters\` for details.` });
      return;
    }

    const label = capitalizeFirstLetter(interaction.options.getString("label").replace(/\s+/g, " "));
    if (!isValidFilterLabel(label)) {
      interaction.reply({ content: `Please input a valid label. It can only contain letters, numbers, and spaces.` });
      return;
    }

    const emoji = interaction.options.getString("emoji");
    if (!isOneEmoji(emoji)) {
      interaction.reply({ content: `Please input a valid emoji. It can only be a default Discord emoji.` });
      return;
    }

    await interaction.deferReply();

    try {
      // Find the filter document for the user
      const filterDocument = await FilterCache.getDocument(interaction.user.id);

      // Handle case where label already exists
      const labelExists = filterDocument.filterList.some((filter) => filter.label === label);
      if (labelExists) {
        interaction.editReply({ content: `The **${label}** filter already exists.` });
        return;
      }

      // Check if filter limit is reached
      if (filterDocument.filterList.length >= 25) {
        interaction.editReply({ content: `You've reached your filter limit of ${filterDocument.filterList.length}.` });
        return;
      }

      await FilterCache.addFilter(interaction.user.id, emoji, label, filter);

      interaction.editReply({ content: `Successfully created filter ${emoji} **${label}** \`${filter}\`!` });
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: "There was an issue creating your filter. Please try again." });
    }
  },
};
