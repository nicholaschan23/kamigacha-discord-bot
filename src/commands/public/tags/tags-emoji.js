const { SlashCommandSubcommandBuilder } = require("discord.js");
const { isValidTag, containsExactlyOneEmoji } = require("../../../utils/gacha/format");
const CardModel = require("../../../database/mongodb/models/card/card");
const TagModel = require("../../../database/mongodb/models/user/tag");
const Logger = require("../../../utils/Logger");
const logger = new Logger("Tags emoji command");

module.exports = {
  category: "public/tags",
  data: new SlashCommandSubcommandBuilder()
    .setName("emoji")
    .setDescription("Change the emoji of a collection tag.")
    .addStringOption((option) => option.setName("tag").setDescription("Name of tag.").setRequired(true))
    .addStringOption((option) => option.setName("emoji").setDescription("New emoji to associate with tag.").setRequired(true)),

  async execute(client, interaction) {
    await interaction.deferReply();

    const tag = interaction.options.getString("tag").toLowerCase();
    if (!isValidTag(tag)) {
      return interaction.editReply({ content: "That tag does not exist." });
    }

    const emoji = interaction.options.getString("emoji");
    if (!containsExactlyOneEmoji(emoji)) {
      return interaction.editReply({ content: `Please input a valid emoji. It can only be a default Discord emoji.` });
    }

    try {
      // Check if tag exists, if so change the emoji
      const updatedDocument = await TagModel(client).findOneAndUpdate(
        {
          userId: interaction.user.id,
          "tagList.tag": tag,
        }, // Filter
        { $set: { "tagList.$.emoji": emoji } }, // Update
        { new: true }
      );
      if (!updatedDocument) {
        return interaction.editReply({ content: "That tag does not exist." });
      }

      // Update cards with the associated tag with the new emoji
      await CardModel(client).updateMany(
        { userId: interaction.user.id, tag: tag }, // Filter
        { $set: { emoji: emoji } } // Update
      );

      interaction.editReply({ content: `Successfully updated tag to ${emoji} \`${tag}\`!` });
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: `There was an issue changing the emoji for your tag. Please try again.` });
    }
  },
};
