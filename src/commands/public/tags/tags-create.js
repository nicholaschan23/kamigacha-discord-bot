const { SlashCommandSubcommandBuilder } = require("discord.js");
const { isValidTag, containsExactlyOneEmoji } = require("../../../utils/gacha/format");
const TagModel = require("../../../database/mongodb/models/card/tag");
const Logger = require("../../../utils/Logger");
const logger = new Logger("Tag create command");

module.exports = {
  category: "public/tags",
  data: new SlashCommandSubcommandBuilder()
    .setName("create")
    .setDescription("Create a collection tag.")
    .addStringOption((option) => option.setName("tag").setDescription("Name of tag.").setRequired(true))
    .addStringOption((option) => option.setName("emoji").setDescription("Emoji to associate with this tag.").setRequired(true)),

  async execute(client, interaction) {
    await interaction.deferReply();

    try {
      const tag = interaction.options.getString("tag").toLowerCase();
      const emoji = interaction.options.getString("emoji");

      if (!isValidTag(tag)) {
        return interaction.editReply({ content: `Please input a valid tag. It can only contain letters, numbers, dashes, or underscores.` });
      }

      if (!containsExactlyOneEmoji(emoji)) {
        return interaction.editReply({ content: `Please input a valid emoji. It can only be a default Discord emoji.` });
      }

      const tagDocument = await TagModel(client).findOneAndUpdate(
        { userID: interaction.user.id }, // Filter
        { $setOnInsert: { userID: interaction.user.id } }, // Set userID only if inserting a new document
        { new: true, upsert: true } // Options: return the modified document and upsert if it doesn't exist
      );      

      if (tagDocument.tagList.get(tag)) {
        return interaction.editReply({ content: `The \`${tag}\` tag already exists.` });
      }

      await TagModel(client).findOneAndUpdate(
        { userID: interaction.user.id }, // Filter
        { $set: { [`tagList.${tag}`]: emoji } } // Update operation
      );

      interaction.editReply({ content: `Successfully created tag ${emoji} \`${tag}\`!` });
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: "Something went wrong. Please try again.", ephemeral: true });
    }
  },
};
