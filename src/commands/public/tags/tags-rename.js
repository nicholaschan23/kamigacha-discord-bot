const { SlashCommandSubcommandBuilder } = require("discord.js");
const mongoose = require("mongoose");
const CardModel = require("@database/mongodb/models/card/card");
const TagModel = require("@database/mongodb/models/user/tag");
const Logger = require("@utils/Logger");
const { isValidTag } = require("@utils/string/validation");

const logger = new Logger("Tags emoji command");

module.exports = {
  category: "public/tags",
  data: new SlashCommandSubcommandBuilder()
    .setName("rename")
    .setDescription("Rename a collection tag.")
    .addStringOption((option) => option.setName("old-tag").setDescription("Current name of tag to rename.").setRequired(true))
    .addStringOption((option) => option.setName("new-tag").setDescription("New name to assign to tag.").setRequired(true)),

  async execute(client, interaction) {
    const oldTag = interaction.options.getString("old-tag").toLowerCase();
    if (!isValidTag(oldTag)) {
      interaction.reply({ content: "That tag does not exist." });
      return;
    }

    const newTag = interaction.options.getString("new-tag").toLowerCase();
    if (!isValidTag(newTag)) {
      interaction.reply({ content: `Please input a valid tag. It can only contain letters, numbers, dashes, or underscores.` });
      return;
    }

    let oldEmoji;
    let oldQuantity;

    await interaction.deferReply();

    try {
      // Find the tag document for the user
      const tagDocument = await TagCache.getDocument(interaction.user.id);

      // Handle case where no tag data exists
      if (tagDocument.tagList.length === 0) {
        interaction.editReply({ content: `You do not have any tags.` });
        return;
      }

      // Check if the new tag already exists
      const duplicateTag = tagDocument.tagList.some((tag) => tag.tag === newTag);
      if (duplicateTag) {
        interaction.editReply({ content: `The \`${newTag}\` tag already exists.` });
        return;
      }

      // Find the index of the old tag in the tagList array
      const oldTagIndex = tagDocument.tagList.findIndex((tag) => tag.tag === oldTag);
      if (oldTagIndex === -1) {
        interaction.editReply({ content: `The \`${oldTag}\` tag does not exist.` });
        return;
      }

      // Extract old emoji and quantity
      ({ emoji: oldEmoji, quantity: oldQuantity } = tagDocument.tagList[oldTagIndex]);
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: `There was an issue renaming your tag. Please try again.` });
    }

    if (oldEmoji === undefined || oldQuantity === undefined) {
      interaction.editReply({ content: `There was an issue renaming your tag. Please try again.` });
      return;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    let tagDocument;
    try {
      // Remove the old tag
      await TagModel.findOneAndUpdate(
        { userId: interaction.user.id },
        {
          $pull: { tagList: { tag: oldTag } },
        },
        { session: session }
      );

      // Add the new tag with sorted order
      tagDocument = await TagModel.findOneAndUpdate(
        { userId: interaction.user.id },
        {
          $push: {
            tagList: {
              $each: [{ tag: newTag, emoji: oldEmoji, quantity: oldQuantity }],
              $sort: { tag: 1 },
            },
          },
        },
        { new: true, session: session }
      );

      // Update cards with the associated old tag with the new tag
      await CardModel.updateMany({ userId: interaction.user.id, tag: oldTag }, { $set: { tag: newTag } }, { session: session });

      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      
      interaction.editReply({ content: `There was an issue changing the emoji for your tag. Please try again.` });
      return;
    }

    await TagCache.cache(interaction.user.id, tagDocument);

    interaction.editReply({ content: `Successfully updated \`${oldTag}\` to \`${newTag}\`!` });
  },
};
