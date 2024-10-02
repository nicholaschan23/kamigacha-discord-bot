const { SlashCommandSubcommandBuilder } = require("discord.js");
const TagCache = require("@database/redis/cache/collectionTag");
const TagModel = require("@database/mongodb/models/user/tag");
const Logger = require("@utils/Logger");
const { isOneEmoji, isValidTag } = require("@utils/string/validation");

const logger = new Logger("Tags create command");

module.exports = {
  category: "public/tags",
  data: new SlashCommandSubcommandBuilder()
    .setName("create")
    .setDescription("Create a collection tag.")
    .addStringOption((option) => option.setName("tag").setDescription("Name of tag.").setRequired(true))
    .addStringOption((option) => option.setName("emoji").setDescription("Emoji to associate with this tag.").setRequired(true)),

  async execute(client, interaction) {
    // Validate tag
    const tag = interaction.options.getString("tag").toLowerCase();
    if (!isValidTag(tag)) {
      interaction.reply({ content: `Please input a valid tag. It can only contain letters, numbers, dashes, or underscores.` });
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

      // Check if the tag already exists
      const tagExists = tagDocument.tagList.some((tagData) => tagData.tag === tag);
      if (tagExists) {
        interaction.editReply({ content: `The \`${tag}\` tag already exists.` });
        return;
      }

      // Check if tag limit is reached
      if (tagDocument.tagList.length >= tagDocument.tagLimit) {
        interaction.editReply({ content: `You've reached your tag limit of ${tagDocument.tagLimit}.` });
        return;
      }

      // Update the tag list in the database
      const updatedDocument = await TagModel.findOneAndUpdate(
        { userId: interaction.user.id, "tagList.tag": { $ne: tag } },
        {
          $push: {
            tagList: {
              $each: [{ tag: tag, emoji: emoji }],
              $sort: { tag: 1 },
            },
          },
        },
        { new: true }
      );

      // Handle case where the tag was not created
      if (!updatedDocument) {
        throw new Error("Tag not created");
      }

      await TagCache.cache(interaction.user.id, updatedDocument);
      interaction.editReply({ content: `Successfully created tag ${emoji} \`${tag}\`!` });
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: "There was an issue creating your tag. Please try again." });
    }
  },
};
