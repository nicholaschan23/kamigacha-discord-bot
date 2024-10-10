const { SlashCommandSubcommandBuilder } = require("discord.js");
const FilterCache = require("@database/redis/cache/collectionFilter");
const FilterModel = require("@database/mongodb/models/user/filter");
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
    // Validate filter label
    const label = capitalizeFirstLetter(interaction.options.getString("label").replace(/\s+/g, " "));
    if (!isValidFilterLabel(label)) {
      interaction.reply({ content: "That filter does not exist." });
      return;
    }

    if (label === "Date") {
      interaction.reply({ content: "You cannot delete the default filter." });
      return;
    }

    await interaction.deferReply();

    try {
      const filterDocument = await FilterCache.getDocument(interaction.user.id);

      // Check if the filter exists in the user's filter list
      const labelExists = filterDocument.filterList.some((filter) => filter.label === label);
      if (!labelExists) {
        interaction.editReply({ content: `That filter does not exist.` });
        return;
      }

      // Update the document by removing the filter
      const updatedDocument = await FilterModel.findOneAndUpdate(
        { userId: interaction.user.id, "filterList.label": label },
        { $pull: { filterList: { label: label } } },
        { new: true }
      );
      if (!updatedDocument) {
        throw new Error("Filter not found");
      }

      await FilterCache.cache(interaction.user.id, updatedDocument);
      interaction.editReply({ content: `Successfully deleted the filter **${label}**!` });
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: `There was an issue deleting your filter. Please try again.` });
    }
  },
};
