const { SlashCommandSubcommandBuilder } = require("discord.js");
const { isValidTag } = require("../../../utils/gacha/format");
const CardModel = require("../../../database/mongodb/models/card/card");
const TagModel = require("../../../database/mongodb/models/user/tag");
const Logger = require("../../../utils/Logger");
const logger = new Logger("Tags emoji command");

module.exports = {
  category: "public/tags",
  data: new SlashCommandSubcommandBuilder()
    .setName("rename")
    .setDescription("Rename a collection tag.")
    .addStringOption((option) => option.setName("old-tag").setDescription("Current name of tag to rename.").setRequired(true))
    .addStringOption((option) => option.setName("new-tag").setDescription("New name to assign to tag.").setRequired(true)),

  async execute(client, interaction) {
    await interaction.deferReply();
    const oldTag = interaction.options.getString("old-tag").toLowerCase();
    const newTag = interaction.options.getString("new-tag").toLowerCase();

    if (!isValidTag(oldTag)) {
      return interaction.editReply({ content: "That tag does not exist." });
    }
    if (!isValidTag(newTag)) {
      return interaction.editReply({ content: `Please input a valid tag. It can only contain letters, numbers, dashes, or underscores.` });
    }

    try {
      const tagDocument = await TagModel(client).findOne(
        { userID: interaction.user.id } // Filter
      );
      const tagSchema = tagDocument.tagList.get(oldTag);
      if (!tagSchema) {
        return interaction.editReply({ content: "That tag does not exist." });
      }

      const updatedTagDocument = await TagModel(client).findOneAndUpdate(
        { userID: interaction.user.id }, // Filter
        {
          // Update operation
          $unset: { [`tagList.${oldTag}`]: "" },
          $set: { [`tagList.${newTag}`]: tagSchema },
        },
        { new: true }
      );

      // Update cards with the associated old tag with the new tag
      await CardModel(client).updateMany(
        { userID: interaction.user.id, tag: oldTag }, // Filter
        { $set: { tag: newTag } } // Update operation
      );

      if (updatedTagDocument.tagList.get(newTag) && !updatedTagDocument.tagList.get(oldTag)) {
        interaction.editReply({ content: `Successfully updated \`${oldTag}\` to \`${newTag}\`!` });
      } else {
        interaction.editReply({ content: `There was an issue renaming your tag. Please try again.` });
      }
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: `There was an issue renaming your tag. Please try again.` });
    }
  },
};
