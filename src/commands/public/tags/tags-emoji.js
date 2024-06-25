const { SlashCommandSubcommandBuilder } = require("discord.js");
const { isValidTag, containsExactlyOneEmoji } = require("../../../utils/gacha/format");
const CardModel = require("../../../database/mongodb/models/card/card");
const TagModel = require("../../../database/mongodb/models/card/tag");
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
    const emoji = interaction.options.getString("emoji");

    if (!isValidTag(tag)) {
      return interaction.editReply({ content: "That tag does not exist." });
    }

    if (!containsExactlyOneEmoji(emoji)) {
      return interaction.editReply({ content: `Please input a valid emoji. It can only be a default Discord emoji.` });
    }

    try {
      const tagDocument = await TagModel(client).findOne(
        { userID: interaction.user.id } // Filter
      );
      if (!tagDocument.tagList.get(tag)) {
        return interaction.editReply({ content: "That tag does not exist." });
      }

      const updatedDocument = await TagModel(client).findOneAndUpdate(
        { userID: interaction.user.id }, // Filter
        { $set: { [`tagList.${tag}`]: `${emoji}` } },
        { new: true }
      );

      // Update cards with the associated tag with the new emoji
      await CardModel(client).updateMany(
        { userID: interaction.user.id, tag: tag }, // Filter
        { $set: { emoji: emoji } } // Update operation
      );

      if (updatedDocument.tagList.get(tag) == emoji) {
        interaction.editReply({ content: `Successfully updated tag to ${emoji} \`${tag}\`!` });
      } else {
        interaction.editReply({ content: `There was an issue changing the emoji for your tag. Please try again.` });
      }
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: `There was an issue changing the emoji for your tag. Please try again.` });
    }
  },
};
