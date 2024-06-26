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
    const emoji = interaction.options.getString("emoji");

    if (!isValidTag(tag)) {
      return interaction.editReply({ content: `Please input a valid tag. It can only contain letters, numbers, dashes, or underscores.` });
    }

    if (!containsExactlyOneEmoji(emoji)) {
      return interaction.editReply({ content: `Please input a valid emoji. It can only be a default Discord emoji.` });
    }

    try {
      const updatedDocument = await TagModel(client).findOneAndUpdate(
        { userId: interaction.user.id }, // Filter
        { $setOnInsert: { userId: interaction.user.id } }, // Set userId only if inserting a new document
        { new: true, upsert: true } // Options: return the modified document and upsert if it doesn't exist
      );

      if (updatedDocument.tagList.get(tag)) {
        return interaction.editReply({ content: `The \`${tag}\` tag already exists.` });
      }

      await TagModel(client).findOneAndUpdate(
        { userId: interaction.user.id }, // Filter
        { $set: { [`tagList.${tag}`]: { emoji: emoji } } } // Update operation
      );

      interaction.editReply({ content: `Successfully created tag ${emoji} \`${tag}\`!` });
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: "There was an issue creating your tag. Please try again." });
    }
  },
};
