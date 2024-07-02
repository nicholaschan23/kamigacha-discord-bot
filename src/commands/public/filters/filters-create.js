const { SlashCommandSubcommandBuilder } = require("discord.js");
const { isValidFilter, isValidFilterLabel, containsExactlyOneEmoji } = require("../../../utils/gacha/format");
const FilterModel = require("../../../database/mongodb/models/user/filter");
const Logger = require("../../../utils/Logger");
const logger = new Logger("Filters create command");

module.exports = {
  category: "public/filters",
  data: new SlashCommandSubcommandBuilder()
    .setName("create")
    .setDescription("Create a collection filter.")
    .addStringOption((option) => option.setName("string").setDescription("String of filters to apply to collection.").setRequired(true))
    .addStringOption((option) => option.setName("label").setDescription("Label to associate with this filter.").setRequired(true))
    .addStringOption((option) => option.setName("emoji").setDescription("Emoji to associate with this filter.").setRequired(true)),

  async execute(client, interaction) {
    await interaction.deferReply();

    const inputFilter = interaction.options.getString("string").toLowerCase().replace(",", "");
    if (!isValidFilter(inputFilter)) {
      return interaction.editReply({ content: `Please input a valid filter string. Refer to \`/help filters\` for details.` });
    }

    const inputLabel = interaction.options.getString("label").replace(/\s+/g, " ");
    if (!isValidFilterLabel(inputLabel)) {
      return interaction.editReply({ content: `Please input a valid label. It can only contain letters, numbers, and spaces.` });
    }

    const inputEmoji = interaction.options.getString("emoji");
    if (!containsExactlyOneEmoji(inputEmoji)) {
      return interaction.editReply({ content: `Please input a valid emoji. It can only be a default Discord emoji.` });
    }

    try {
      const filterDocument = await FilterModel(client).findOneAndUpdate(
        { userId: interaction.user.id }, // Filter
        {}, // Update
        { new: true, upsert: true } // Options: return the modified document and upsert if it doesn't exist
      );

      // Check max limit
      if (filterDocument.filterList.size >= filterDocument.filterLimit) {
        return interaction.editReply({ content: `You've reached your filter limit of ${filterDocument.tagLimit}.` });
      }

      // Check for any duplicates
      for (const savedFilter of filterDocument.filterList) {
        const { emoji, label, filter } = savedFilter;
        if (emoji == inputEmoji) {
          return interaction.editReply({ content: `That ${emoji} tag already exists.` });
        }
        if (label.toLowerCase() == inputLabel.toLowerCase()) {
          return interaction.editReply({ content: `That \`${label}\` label already exists.` });
        }
        if (filter == inputFilter) {
          return interaction.editReply({ content: `That \`${filter}\` filter string already exists.` });
        }
      }

      // Save document
      await FilterModel(client).findOneAndUpdate(
        { userId: interaction.user.id }, // Filter
        {
          $push: {
            filterList: {
              $each: [{ emoji: inputEmoji, label: inputLabel, filter: inputFilter }],
              $sort: { label: 1 },
            },
          },
        }
      );

      interaction.editReply({ content: `Successfully created filter ${inputEmoji} **${inputLabel}** \`${inputFilter}\`!` });
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: "There was an issue creating your filter. Please try again." });
    }
  },
};
