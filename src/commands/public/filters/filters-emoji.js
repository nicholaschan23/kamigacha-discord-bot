const { SlashCommandSubcommandBuilder } = require("discord.js");
const { isValidFilterLabel, containsExactlyOneEmoji } = require("../../../utils/gacha/format");
const FilterModel = require("../../../database/mongodb/models/user/filter");
const Logger = require("../../../utils/Logger");
const logger = new Logger("Filters emoji command");

module.exports = {
  category: "public/filters",
  data: new SlashCommandSubcommandBuilder()
    .setName("emoji")
    .setDescription("Change the emoji of a collection filter.")
    .addStringOption((option) => option.setName("label").setDescription("Name of filter.").setRequired(true))
    .addStringOption((option) => option.setName("emoji").setDescription("New emoji to associate with filter.").setRequired(true)),

  async execute(client, interaction) {
    await interaction.deferReply();
    
    const label = interaction.options.getString("label").replace(/\s+/g, " ");
    if (!isValidFilterLabel(label)) {
      return interaction.editReply({ content: "That filter does not exist." });
    }
    
    const emoji = interaction.options.getString("emoji");
    if (!containsExactlyOneEmoji(emoji)) {
      return interaction.editReply({ content: `Please input a valid emoji. It can only be a default Discord emoji.` });
    }

    try {
      const filterDocument = await FilterModel(client).findOne(
        { userId: interaction.user.id, "filterList.label": new RegExp(`^${label}$`, "i") }, // Filter
        { "filterList.$": 1 } // Projection to only include the matched sub-document
      );
      if (!filterDocument) {
        return interaction.editReply({ content: "That filter does not exist." });
      }

      // Extract the actual label
      const actualLabel = filterDocument.filterList[0].label;

      // No duplicate emojis
      const duplicateEmoji = filterDocument.filterList.find(option => option.emoji === emoji);
      if (duplicateEmoji) {
        return interaction.editReply({ content: "That emoji is already being used for another filter." });
      }

      const updatedDocument = await FilterModel(client).findOneAndUpdate(
        { userId: interaction.user.id, 'filterList.label': actualLabel },
        { $set: { 'filterList.$.emoji': emoji } },
        { new: true }
      );

      interaction.editReply({ content: `Successfully updated filter to ${emoji} **${actualLabel}**!` });
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: `There was an issue changing the emoji for your filter. Please try again.` });
    }
  },
};
