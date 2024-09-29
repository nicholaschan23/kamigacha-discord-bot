const { SlashCommandSubcommandBuilder } = require("discord.js");
const FilterCache = require("@database/redis/cache/collectionFilter");
const Logger = require("@utils/Logger");
const { capitalizeFirstLetter } = require("@utils/string/format");
const { isValidFilterLabel } = require("@utils/string/validation");

const logger = new Logger("Filters delete command");

module.exports = {
  category: "public/filters",
  data: new SlashCommandSubcommandBuilder()
    .setName("delete")
    .setDescription("Delete a collection filter.")
    .addStringOption((option) => option.setName("label").setDescription("Name of filter to delete.").setRequired(true)),

  async execute(client, interaction) {
    await interaction.deferReply();

    const label = capitalizeFirstLetter(interaction.options.getString("label").replace(/\s+/g, " "));
    if (!isValidFilterLabel(label)) {
      interaction.editReply({ content: "That filter does not exist." });
      return;
    }

    try {
      const filterDocument = await FilterCache.getDocument(interaction.user.id);

      // Handle case where no filter data exists
      if (filterDocument.filterList.length === 0) {
        interaction.reply({ content: `You do not have any filters.` });
        return;
      }

      // Filter doesn't exist
      const labelExists = filterDocument.filterList.some((filter) => filter.label === label);
      if (!labelExists) {
        interaction.editReply({ content: `That filter does not exist.` });
        return;
      }

      await FilterCache.deleteFilter(interaction.user.id, label);

      interaction.editReply({ content: `Successfully deleted the filter **${label}**!` });
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: `There was an issue deleting your filter. Please try again.` });
    }
  },
};
