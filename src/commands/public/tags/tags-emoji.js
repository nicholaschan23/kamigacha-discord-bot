const { SlashCommandSubcommandBuilder } = require("discord.js");
const mongoose = require("mongoose");
const CardModel = require("@database/mongodb/models/card/card");
const TagCache = require("@database/redis/cache/collectionTag");
const TagModel = require("@database/mongodb/models/user/tag");
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
    const tag = interaction.options.getString("tag").toLowerCase();
    if (!isValidTag(tag)) {
      interaction.reply({ content: "That tag does not exist." });
      return;
    }

    const emoji = interaction.options.getString("emoji");
    if (!isOneEmoji(emoji)) {
      interaction.reply({ content: `Please input a valid emoji. It can only be a default Discord emoji.` });
      return;
    }

    await interaction.deferReply();

    try {
      const tagDocument = await TagCache.getDocument(interaction.user.id);

      if (tagDocument.tagList.length === 0) {
        return interaction.editReply({ content: `You do not have any tags.` });
      }

      const tagExists = tagDocument.tagList.some((tagData) => tagData.tag === tag);
      if (!tagExists) {
        interaction.editReply({ content: "That tag does not exist." });
        return;
      }

      interaction.editReply({ content: `Successfully updated tag to ${emoji} \`${tag}\`!` });
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: `There was an issue changing the emoji for your tag. Please try again.` });
      return;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const tagDocument = await TagModel.findOneAndUpdate(
        { userId: interaction.user.id, "tagList.tag": tag },
        { $set: { "tagList.$.emoji": emoji } },
        { new: true, session: session }
      );
      await TagCache.cache(interaction.user.id, tagDocument);

      // Update cards with the associated tag with the new emoji
      await CardModel.updateMany({ userId: interaction.user.id, tag: tag }, { $set: { emoji: emoji } }, { session: session });

      interaction.editReply({ content: `Successfully deleted the tag \`${tag}\`!` });
      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      interaction.editReply({ content: `There was an issue changing the emoji for your tag. Please try again.` });
    }
  },
};
