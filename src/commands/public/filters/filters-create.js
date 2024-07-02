const { SlashCommandSubcommandBuilder } = require("discord.js");
const { isValidFilter, isValidFilterLabel, containsExactlyOneEmoji, capitalizeFirstLetter } = require("../../../utils/gacha/format");
const FilterModel = require("../../../database/mongodb/models/user/filter");
const Logger = require("../../../utils/Logger");
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
    await interaction.deferReply();

    const filter = interaction.options.getString("filter").toLowerCase().replace(",", "");
    if (!isValidFilter(filter)) {
      return interaction.editReply({ content: `Please input a valid filter string. Refer to \`/help filters\` for details.` });
    }

    const label = capitalizeFirstLetter(interaction.options.getString("label").replace(/\s+/g, " "));
    if (!isValidFilterLabel(label)) {
      return interaction.editReply({ content: `Please input a valid label. It can only contain letters, numbers, and spaces.` });
    }

    const emoji = interaction.options.getString("emoji");
    if (!containsExactlyOneEmoji(emoji)) {
      return interaction.editReply({ content: `Please input a valid emoji. It can only be a default Discord emoji.` });
    }

    try {
      // Find the filter document for the user
      const filterDocument = await FilterModel(client).findOneAndUpdate(
        { userId: interaction.user.id, "filterList.label": { $ne: label } }, // Filter
        { $setOnInsert: { userId: interaction.user.id } }, // Update
        { new: true, upsert: true }
      );

      // Handle case where no filter data exists
      if (!filterDocument) {
        return interaction.editReply({ content: `The **${label}** filter already exists.` });
      }

      // Check if filter limit is reached
      if (filterDocument.filterList.length >= 25) {
        return interaction.editReply({ content: `You've reached your filter limit of ${filterDocument.filterList.length}.` });
      }

      // Save document
      await FilterModel(client).findOneAndUpdate(
        { userId: interaction.user.id }, // Filter
        {
          $push: {
            filterList: {
              $each: [{ emoji: emoji, label: label, filter: filter }],
              $sort: { label: 1 },
            },
          },
        } // Update
      );

      interaction.editReply({ content: `Successfully created filter ${emoji} **${label}** \`${filter}\`!` });
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: "There was an issue creating your filter. Please try again." });
    }
  },
};
