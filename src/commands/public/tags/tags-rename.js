const { SlashCommandSubcommandBuilder } = require("discord.js");
const { isValidTag } = require("../../../utils/string/validation");
const CardModel = require("../../../database/mongodb/models/card/card");
const TagModel = require("../../../database/mongodb/models/user/tag");
const Logger = require("../../../utils/Logger");
const logger = new Logger("Tags emoji command");

module.exports = {
  category: "public/tags",
  data: new SlashCommandSubcommandBuilder()
    .setName("rename")
    .setDescription("Rename a collection tag.")
    .addStringOption((option) => option.setName("old-tag").setDescription("Current name of tag to rename.").setRequired(true))
    .addStringOption((option) => option.setName("new-tag").setDescription("New name to assign to tag.").setRequired(true)),

  async execute(client, interaction) {
    await interaction.deferReply();

    const oldTag = interaction.options.getString("old-tag").toLowerCase();
    if (!isValidTag(oldTag)) {
      return interaction.editReply({ content: "That tag does not exist." });
    }

    const newTag = interaction.options.getString("new-tag").toLowerCase();
    if (!isValidTag(newTag)) {
      return interaction.editReply({ content: `Please input a valid tag. It can only contain letters, numbers, dashes, or underscores.` });
    }

    try {
      // Find the tag document for the user
      const tagDocument = await TagModel.findOne({ userId: interaction.user.id });

      // Handle case where no tag data exists
      if (!tagDocument) {
        return interaction.reply({ content: `You do not have any tags.` });
      }

      // Check if the new tag already exists
      const duplicateTag = tagDocument.tagList.some((tag) => tag.tag === newTag);
      if (duplicateTag) {
        return interaction.editReply({ content: `The \`${newTag}\` tag already exists.` });
      }

      // Find the index of the old tag in the tagList array
      const oldTagIndex = tagDocument.tagList.findIndex((tag) => tag.tag === oldTag);
      if (oldTagIndex === -1) {
        return interaction.editReply({ content: `The \`${oldTag}\` tag does not exist.` });
      }

      // Extract old emoji and quantity
      const { emoji: oldEmoji, quantity: oldQuantity } = tagDocument.tagList[oldTagIndex];

      // Remove the old tag
      await TagModel.findOneAndUpdate(
        { userId: interaction.user.id },
        {
          $pull: { tagList: { tag: oldTag } },
        }
      );

      // Add the new tag with sorted order
      await TagModel.findOneAndUpdate(
        { userId: interaction.user.id },
        {
          $push: {
            tagList: {
              $each: [{ tag: newTag, emoji: oldEmoji, quantity: oldQuantity }],
              $sort: { tag: 1 }, // Sort by tag alphabetically
            },
          },
        }
      );

      // Update cards with the associated old tag with the new tag
      await CardModel.updateMany(
        { userId: interaction.user.id, tag: oldTag }, // Filter
        { $set: { tag: newTag } } // Update
      );

      interaction.editReply({ content: `Successfully updated \`${oldTag}\` to \`${newTag}\`!` });
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: `There was an issue renaming your tag. Please try again.` });
    }
  },
};
