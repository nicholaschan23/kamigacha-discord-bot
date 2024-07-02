const { SlashCommandSubcommandBuilder } = require("discord.js");
const { isValidTag } = require("../../../utils/gacha/format");
const TagModel = require("../../../database/mongodb/models/user/tag");
const CardModel = require("../../../database/mongodb/models/card/card");
const Logger = require("../../../utils/Logger");
const logger = new Logger("Tags delete command");

module.exports = {
  category: "public/tags",
  data: new SlashCommandSubcommandBuilder()
    .setName("delete")
    .setDescription("Delete a collection tag.")
    .addStringOption((option) => option.setName("tag").setDescription("Name of tag to delete.").setRequired(true)),

  async execute(client, interaction) {
    await interaction.deferReply();
    
    const tag = interaction.options.getString("tag").toLowerCase();
    if (!isValidTag(tag)) {
      return interaction.editReply({ content: "That tag does not exist." });
    }

    try {
      // Check if tag exists, if so delete it
      const updatedDocument = await TagModel(client).findOneAndUpdate(
        { userId: interaction.user.id }, // Filter
        { $pull: { tagList: { tag: tag } } }, // Update
        { new: true }
      );
      if (!updatedDocument) {
        return interaction.editReply({ content: `That tag does not exist.` });
      }

      // Update cards with the associated tag with default untagged values
      await CardModel(client).updateMany(
        { userId: interaction.user.id, tag: tag }, // Filter
        { $set: { tag: "untagged", emoji: "▪️" } } // Update
      );

        interaction.editReply({ content: `Successfully deleted the tag \`${tag}\`!` });
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: `There was an issue deleting your tag. Please try again.` });
    }
  },
};
