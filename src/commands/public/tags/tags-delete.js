const { SlashCommandSubcommandBuilder } = require("discord.js");
const mongoose = require("mongoose");
const TagCache = require("@database/redis/cache/collectionTag");
const TagModel = require("@database/mongodb/models/user/tag");
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
    const tag = interaction.options.getString("tag").toLowerCase();

    if (!isValidTag(tag)) {
      return interaction.reply({ content: "That tag does not exist." });
    }

    await interaction.deferReply();

    try {
      const tagDocument = await TagCache.getDocument(interaction.user.id);

      if (tagDocument.tagList.length === 0) {
        return interaction.editReply({ content: `You do not have any tags.` });
      }

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

    const session = await mongoose.startSession();
    session.startTransaction();

    let tagDocument;
    try {
      tagDocument = await TagModel.findOneAndUpdate(
        { userId: interaction.user.id, "tagList.tag": tag },
        { $pull: { tagList: { tag: tag } } },
        { new: true, session: session }
      );

      if (!tagDocument) {
        throw new Error("Tag not found");
      }
      
      // Update cards with the associated tag with default untagged values
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
