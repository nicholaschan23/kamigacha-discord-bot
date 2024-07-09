const { SlashCommandSubcommandBuilder } = require("discord.js");
const { isValidFilterLabel, containsExactlyOneEmoji } = require("../../../utils/gacha/format");
const { capitalizeFirstLetter } = require("../../../utils/stringUtils")
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

    const label = capitalizeFirstLetter(interaction.options.getString("label").replace(/\s+/g, " "));
    if (!isValidFilterLabel(label)) {
      return interaction.editReply({ content: "That filter does not exist." });
    }

    const emoji = interaction.options.getString("emoji");
    if (!containsExactlyOneEmoji(emoji)) {
      return interaction.editReply({ content: `Please input a valid emoji. It can only be a default Discord emoji.` });
    }

    try {
      // Check if filter exists, if so change the emoji
      const filterDocument = await FilterModel(client).findOneAndUpdate(
        {
          userId: interaction.user.id,
          "filterList.label": label,
        }, // Filter
        { $set: { "filterList.$.emoji": emoji } }, // Update
        { new: true }
      );
      if (!filterDocument) {
        return interaction.editReply({ content: "That filter does not exist." });
      }

      interaction.editReply({ content: `Successfully updated filter to ${emoji} **${label}**!` });
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: `There was an issue changing the emoji for your filter. Please try again.` });
    }
  },
};
