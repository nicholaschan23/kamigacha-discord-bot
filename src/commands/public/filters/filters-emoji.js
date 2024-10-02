const { SlashCommandSubcommandBuilder } = require("discord.js");
const FilterCache = require("@database/redis/cache/collectionFilter");
const Logger = require("@utils/Logger");
const { isOneEmoji, isValidFilterLabel } = require("@utils/string/validation");
const { capitalizeFirstLetter } = require("@utils/string/format");

const logger = new Logger("Filters emoji command");

module.exports = {
  category: "public/filters",
  data: new SlashCommandSubcommandBuilder()
    .setName("emoji")
    .setDescription("Change the emoji of a collection filter.")
    .addStringOption((option) => option.setName("label").setDescription("Name of filter.").setRequired(true))
    .addStringOption((option) => option.setName("emoji").setDescription("New emoji to associate with filter.").setRequired(true)),

  async execute(client, interaction) {
    // Validate filter label
    const label = capitalizeFirstLetter(interaction.options.getString("label").replace(/\s+/g, " "));
    if (!isValidFilterLabel(label)) {
      interaction.reply({ content: "That filter does not exist." });
      return;
    }

    // Validate emoji
    const emoji = interaction.options.getString("emoji");
    if (!isOneEmoji(emoji)) {
      interaction.reply({ content: "Please input a valid emoji. It can only be a default Discord emoji." });
      return;
    }

    await interaction.deferReply();

    try {
      const filterDocument = await FilterCache.getDocument(interaction.user.id);

      // Handle case where no filter data exists
      if (filterDocument.filterList.length === 0) {
        interaction.reply({ content: "You do not have any filters." });
        return;
      }

      // Check if the label exists in the filter list
      const labelExists = filterDocument.filterList.some((filter) => filter.label === label);
      if (!labelExists) {
        interaction.editReply({ content: "That filter does not exist." });
        return;
      }

      // Update the filter document with the new emoji
      const updatedDocument = await FilterModel.findOneAndUpdate(
        { userId: interaction.user.id, "filterList.label": label },
        { $set: { "filterList.$.emoji": emoji } },
        { new: true }
      );
      if (!updatedDocument) {
        throw new Error("Filter not found");
      }

      await FilterCache.cache(interaction.user.id, updatedDocument);
      interaction.editReply({ content: `Successfully updated filter to ${emoji} **${label}**!` });
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: "There was an issue changing the emoji for your filter. Please try again." });
    }
  },
};
