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
    // Get the label and normalize whitespace
    const label = interaction.options.getString("label").replace(/\s+/g, " ");
    if (!isValidFilterLabel(label)) {
      interaction.reply({ content: "That filter does not exist." });
      return;
    }

    if (["Modified", "Most wished", "Show wish count", "Untagged"].includes(label)) {
      interaction.editReply({ content: "You cannot change the string of a default filter." });
      return;
    }

    // Get the filter string, convert to lowercase, and normalize whitespace
    const filter = interaction.options.getString("string").toLowerCase().replace(/\s+/g, " ");
    if (!isValidFilter(filter)) {
      interaction.reply({ content: `Please input a valid emoji. It can only be a default Discord emoji.` });
      return;
    }

    // Defer the reply to allow for async operations
    await interaction.deferReply();

    try {
      // Retrieve the filter document from the cache
      const filterDocument = await FilterCache.getDocument(interaction.user.id);

      // Handle case where no filter data exists
      if (filterDocument.filterList.length === 0) {
        interaction.reply({ content: `You do not have any filters.` });
        return;
      }

      // Check if the label exists in the filter list
      const labelExists = filterDocument.filterList.some((filter) => filter.label === label);
      if (!labelExists) {
        interaction.editReply({ content: "That filter does not exist." });
        return;
      }

      // Update the filter string in the database
      const updatedDocument = await FilterModel.findOneAndUpdate(
        { userId: interaction.user.id, "filterList.label": label },
        { $set: { "filterList.$.filter": filter } },
        { new: true }
      );
      if (!updatedDocument) {
        throw new Error("Filter not found");
      }

      await FilterCache.cache(interaction.user.id, updatedDocument);
      interaction.editReply({ content: `Successfully updated filter to **${label}** \`${filter}\`!` });
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: `There was an issue changing the filter string for your filter. Please try again.` });
    }
  },
};
