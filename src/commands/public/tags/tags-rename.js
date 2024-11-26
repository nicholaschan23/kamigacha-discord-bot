const { SlashCommandSubcommandBuilder } = require("discord.js");
const CardModel = require("@database/mongodb/models/card/card");
const TagModel = require("@database/mongodb/models/user/tag");
const TagCache = require("@database/redis/cache/collectionTag");
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
    // Validate old tag
    const oldTag = interaction.options.getString("old-tag").toLowerCase();
    if (!isValidTag(oldTag)) {
      interaction.reply({ content: "That tag does not exist." });
      return;
    }

    // Validate new tag
    const newTag = interaction.options.getString("new-tag").toLowerCase();
    if (!isValidTag(newTag)) {
      interaction.reply({ content: `Please input a valid tag. It can only contain letters, numbers, dashes, or underscores.` });
      return;
    }

    await interaction.deferReply();

    let oldEmoji;
    let oldQuantity;
    try {
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

      ({ emoji: oldEmoji, quantity: oldQuantity } = tagDocument.tagList[oldTagIndex]);
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: `There was an issue renaming your tag. Please try again.` });
    }

    const session = await CardModel.startSession();
    session.startTransaction();

    let tagDocument;
    try {
      // Remove the old tag
      tagDocument = await TagModel.findOneAndUpdate(
        { userId: interaction.user.id, "tagList.tag": oldTag },
        {
          $pull: { tagList: { tag: oldTag } },
        },
        { session: session }
      );
      if (!tagDocument) {
        throw new Error("Tag not found");
      }

      // Add the new tag with sorted order
      tagDocument = await TagModel.findOneAndUpdate(
        { userId: interaction.user.id, "tagList.tag": { $ne: newTag } },
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
      if (!tagDocument) {
        throw new Error("Tag not created");
      }

      // Update cards with the associated old tag with the new tag
      await CardModel.updateMany({ ownerId: interaction.user.id, tag: oldTag }, { $set: { tag: newTag } }, { session: session });

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
