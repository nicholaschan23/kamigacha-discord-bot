const { SlashCommandSubcommandBuilder } = require("discord.js");
const { isValidTag } = require("../../../utils/gacha/format");
const TagModel = require("../../../database/mongodb/models/card/tag");
const CardModel = require("../../../database/mongodb/models/card/card");
const Logger = require("../../../utils/Logger");
const logger = new Logger("Tags delete command");

module.exports = {
  category: "public/tags",
  data: new SlashCommandSubcommandBuilder()
    .setName("delete")
    .setDescription("Delete a collection tag.")
    .addStringOption((option) => option.setName("tag").setDescription("Name of tag to delete.").setRequired(true)),

  async execute(client, interaction) {
    await interaction.deferReply();
    const tag = interaction.options.getString("tag").toLowerCase();

    if (!isValidTag(tag)) {
      return interaction.editReply({ content: "That tag does not exist." });
    }

    try {
      const updatedDocument = await TagModel(client).findOneAndUpdate(
        { userID: interaction.user.id }, // Filter
        { $unset: { [`tagList.${tag}`]: "" } },
        { new: true }
      );

      // Handle if document doesn't exist or if the field wasn't there to unset
      if (!updatedDocument) {
        return interaction.editReply({ content: `That tag does not exist.` });
      }

      // Update cards with the associated tag with default untagged values
      await CardModel(client).updateMany(
        { userID: interaction.user.id, tag: tag }, // Filter
        {
          // Update operation
          $set: {
            tag: "untagged",
            emoji: ":black_small_square:",
          },
        }
      );

      // Check if the field was unset
      if (!updatedDocument.tagList[tag]) {
        interaction.editReply({ content: `Successfully deleted the tag \`${tag}\`!` });
      } else {
        interaction.editReply({ content: `There was an issue deleting your tag. Please try again.` });
      }
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: `There was an issue deleting your tag. Please try again.` });
    }
  },
};
