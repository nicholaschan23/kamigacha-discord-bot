const { SlashCommandSubcommandBuilder } = require("discord.js");
const FilterCache = require("@database/redis/cache/collectionFilter");
const { isValidFilterLabel, isValidFilter } = require("@utils/string/validation");
const Logger = require("@utils/Logger");

const logger = new Logger("Filters string command");

module.exports = {
  category: "public/filters",
  data: new SlashCommandSubcommandBuilder()
    .setName("string")
    .setDescription("Change the filter string of a collection filter.")
    .addStringOption((option) => option.setName("label").setDescription("Name of filter.").setRequired(true))
    .addStringOption((option) => option.setName("string").setDescription("New string of filters.").setRequired(true)),

  async execute(client, interaction) {
    const label = interaction.options.getString("label").replace(/\s+/g, " ");
    if (!isValidFilterLabel(label)) {
      interaction.reply({ content: "That filter does not exist." });
      return;
    }

    const filter = interaction.options.getString("string").toLowerCase().replace(/\s+/g, " ");
    if (!isValidFilter(filter)) {
      interaction.reply({ content: `Please input a valid emoji. It can only be a default Discord emoji.` });
      return;
    }

    await interaction.deferReply();

    try {
      const filterDocument = await FilterCache.getDocument(interaction.user.id);

      // Handle case where no filter data exists
      if (filterDocument.filterList.length === 0) {
        interaction.reply({ content: `You do not have any filters.` });
        return;
      }

      const labelExists = filterDocument.filterList.some((filter) => filter.label === label);
      if (!labelExists) {
        interaction.editReply({ content: "That filter does not exist." });
        return;
      }

      await FilterCache.updateFilterString(interaction.user.id, label, string);

      interaction.editReply({ content: `Successfully updated filter to **${label}** \`${filter}\`!` });
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: `There was an issue changing the filter string for your filter. Please try again.` });
    }
  },
};
