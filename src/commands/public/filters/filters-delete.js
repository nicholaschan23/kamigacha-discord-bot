const { SlashCommandSubcommandBuilder } = require("discord.js");
const { isValidFilterLabel } = require("../../../utils/gacha/format");
const { capitalizeFirstLetter } = require("../../../utils/stringUtils");
const FilterModel = require("../../../database/mongodb/models/user/filter");
const Logger = require("../../../utils/Logger");
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
      return interaction.editReply({ content: "That filter does not exist." });
    }

    try {
      // Check if filter exists, if so delete it
      const updatedDocument = await FilterModel().findOneAndUpdate(
        { userId: interaction.user.id, "filterList.label": label }, // Filter
        { $pull: { filterList: { label: label } } }, // Update
        { new: true }
      );
      if (!updatedDocument) {
        return interaction.editReply({ content: `That filter does not exist.` });
      }

      interaction.editReply({ content: `Successfully deleted the filter **${label}**!` });
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: `There was an issue deleting your filter. Please try again.` });
    }
  },
};
