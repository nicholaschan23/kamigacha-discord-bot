const { SlashCommandSubcommandBuilder } = require("discord.js");
const { isValidTag, containsExactlyOneEmoji } = require("../../../utils/gacha/format");
const TagModel = require("../../../database/mongodb/models/user/tag");
const Logger = require("../../../utils/Logger");
const logger = new Logger("Tags create command");

module.exports = {
  category: "public/tags",
  data: new SlashCommandSubcommandBuilder()
    .setName("create")
    .setDescription("Create a collection tag.")
    .addStringOption((option) => option.setName("tag").setDescription("Name of tag.").setRequired(true))
    .addStringOption((option) => option.setName("emoji").setDescription("Emoji to associate with this tag.").setRequired(true)),

  async execute(client, interaction) {
    await interaction.deferReply();
    
    const tag = interaction.options.getString("tag").toLowerCase();
    if (!isValidTag(tag)) {
      return interaction.editReply({ content: `Please input a valid tag. It can only contain letters, numbers, dashes, or underscores.` });
    }
    
    const emoji = interaction.options.getString("emoji");
    if (!containsExactlyOneEmoji(emoji)) {
      return interaction.editReply({ content: `Please input a valid emoji. It can only be a default Discord emoji.` });
    }

    try {
      // Check if the tag already exists
      const tagExists = await TagModel(client).findOne(
        {
          userId: interaction.user.id,
          tagList: { $elemMatch: { tag: tag } },
        },
        { "tagList.$": 1 }
      );
      if (tagExists) {
        return interaction.editReply({ content: `The \`${tag}\` tag already exists.` });
      }

      const tagDocument = await TagModel(client).findOneAndUpdate(
        { userId: interaction.user.id }, // Filter
        {}, // Update
        { new: true, upsert: true } // Options: return the modified document and upsert if it doesn't exist
      );

      if (tagDocument.tagList.length >= tagDocument.tagLimit) {
        return interaction.editReply({ content: `You've reached your tag limit of ${tagDocument.tagLimit}.` });
      }

      // Save document
      await TagModel(client).findOneAndUpdate(
        { userId: interaction.user.id }, // Filter
        {
          $push: {
            tagList: {
              $each: [{ tag: tag, emoji: emoji }],
              $sort: { tag: 1 }, // Sort by tag alphabetically
            },
          },
        } // Update
      );

      interaction.editReply({ content: `Successfully created tag ${emoji} \`${tag}\`!` });
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: "There was an issue creating your tag. Please try again." });
    }
  },
};
