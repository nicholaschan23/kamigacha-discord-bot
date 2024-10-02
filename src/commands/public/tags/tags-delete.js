const { SlashCommandSubcommandBuilder } = require("discord.js");
const TagCache = require("@database/redis/cache/collectionTag");
const TagModel = require("@database/mongodb/models/user/tag");
const CardModel = require("@database/mongodb/models/card/card");
const Logger = require("@utils/Logger");
const { isValidTag } = require("@utils/string/validation");

const logger = new Logger("Tags delete command");

module.exports = {
  category: "public/tags",
  data: new SlashCommandSubcommandBuilder()
    .setName("delete")
    .setDescription("Delete a collection tag.")
    .addStringOption((option) => option.setName("tag").setDescription("Name of tag to delete.").setRequired(true)),

  async execute(client, interaction) {
    // Validate tag
    const tag = interaction.options.getString("tag").toLowerCase();
    if (!isValidTag(tag)) {
      interaction.reply({ content: "That tag does not exist." });
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

      // Check if the tag exists in the user's tag list
      const tagExists = tagDocument.tagList.some((tagData) => tagData.tag === tag);
      if (!tagExists) {
        interaction.editReply({ content: `That tag does not exist.` });
        return;
      }
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: `There was an issue deleting your tag. Please try again.` });
      return;
    }

    // Start a session for transaction
    const session = await CardModel.startSession();
    session.startTransaction();

    let tagDocument;
    try {
      // Remove the tag from the user's tag list
      tagDocument = await TagModel.findOneAndUpdate(
        { userId: interaction.user.id, "tagList.tag": tag },
        { $pull: { tagList: { tag: tag } } },
        { new: true, session: session }
      );
      if (!tagDocument) {
        throw new Error("Tag not found");
      }

      // Update cards with the associated tag to default untagged values
      await CardModel.updateMany({ ownerId: interaction.user.id, tag: tag }, { $set: { tag: "untagged", emoji: "▪️" } }, { session: session });

      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      interaction.editReply({ content: `There was an issue deleting your tag. Please try again.` });
      return;
    }

    await TagCache.cache(interaction.user.id, tagDocument);
    interaction.editReply({ content: `Successfully deleted the tag \`${tag}\`!` });
  },
};
