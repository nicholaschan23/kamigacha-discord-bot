const { SlashCommandSubcommandBuilder } = require("discord.js");
const CardModel = require("@database/mongodb/models/card/card");
const TagModel = require("@database/mongodb/models/user/tag");
const TagCache = require("@database/redis/cache/collectionTag");
const Logger = require("@utils/Logger");
const { isOneEmoji, isValidTag } = require("@utils/string/validation");

const logger = new Logger("Tags emoji command");

module.exports = {
  category: "public/tags",
  data: new SlashCommandSubcommandBuilder()
    .setName("emoji")
    .setDescription("Change the emoji of a collection tag.")
    .addStringOption((option) => option.setName("tag").setDescription("Name of tag.").setRequired(true))
    .addStringOption((option) => option.setName("emoji").setDescription("New emoji to associate with tag.").setRequired(true)),

  async execute(client, interaction) {
    // Validate tag
    const tag = interaction.options.getString("tag").toLowerCase();
    if (!isValidTag(tag)) {
      interaction.reply({ content: "That tag does not exist." });
      return;
    }

    // Validate emoji
    const emoji = interaction.options.getString("emoji");
    if (!isOneEmoji(emoji)) {
      interaction.reply({ content: `Please input a valid emoji. It can only be a default Discord emoji.` });
      return;
    }

    await interaction.deferReply();

    try {
      const tagDocument = await TagCache.getDocument(interaction.user.id);

      // Check if the user has any tags
      if (tagDocument.tagList.length === 0) {
        interaction.editReply({ content: `You do not have any tags.` });
        return;
      }

      // Check if the specified tag exists in the user's tag list
      const tagExists = tagDocument.tagList.some((tagData) => tagData.tag === tag);
      if (!tagExists) {
        interaction.editReply({ content: "That tag does not exist." });
        return;
      }
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: `There was an issue changing the emoji for your tag. Please try again.` });
      return;
    }

    const session = await CardModel.startSession();
    session.startTransaction();

    let tagDocument;
    try {
      // Find the tag document and update the emoji for the specified tag
      tagDocument = await TagModel.findOneAndUpdate(
        { userId: interaction.user.id, "tagList.tag": tag },
        { $set: { "tagList.$.emoji": emoji } },
        { new: true, session: session }
      );
      if (!tagDocument) {
        throw new Error("Tag not found");
      }

      // Update cards with the associated tag with the new emoji
      await CardModel.updateMany({ ownerId: interaction.user.id, tag: tag }, { $set: { emoji: emoji } }, { session: session });

      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      interaction.editReply({ content: `There was an issue changing the emoji for your tag. Please try again.` });
      return;
    }

    await TagCache.cache(interaction.user.id, tagDocument);
    interaction.editReply({ content: `Successfully updated tag to ${emoji} \`${tag}\`!` });
  },
};
