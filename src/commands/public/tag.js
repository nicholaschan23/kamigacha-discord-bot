const { SlashCommandBuilder } = require("discord.js");
const CardModel = require("../../database/mongodb/models/card/card");
const TagModel = require("../../database/mongodb/models/card/tag");
const { isValidTag } = require("../../utils/gacha/format");
const Logger = require("../../utils/Logger");
const logger = new Logger("Tag command");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder()
    .setName("tag")
    .setDescription("Tag a card in your collection.")
    .addStringOption((option) => option.setName("tag").setDescription("Tag name.").setRequired(true))
    .addStringOption((option) => option.setName("codes").setDescription("Cards you want to associate with this tag.").setRequired(true)),

  async execute(client, interaction) {
    await interaction.deferReply();

    const tag = interaction.options.getString("tag").toLowerCase();
    if (!isValidTag(tag)) {
      return interaction.editReply({ content: "That tag does not exist." });
    }

    // Check if tag exists
    const tagDocument = await TagModel(client).findOne(
      // Filter
      { userID: interaction.user.id }
    );
    const emoji = tagDocument.tagList.get(tag);
    if (!emoji) {
      return interaction.editReply({ content: "That tag does not exist." });
    }

    const inputString = interaction.options.getString("codes").toLowerCase();
    const inputCardCodes = inputString.split(/[\s,]+/).filter((code) => code);
    if (inputCardCodes.length > 50) {
      return interaction.editReply({ content: `You can only tag up to 50 cards at a time (entered ${inputCardCodes.length}).` });
    }

    try {
      // Fetch the cards from the database based on the provided card codes
      const queriedCards = await CardModel(client).find({
        code: { $in: inputCardCodes },
      });

      // Identify invalid or missing card codes
      const queriedCodes = queriedCards.map((card) => card.code);
      const invalidCodes = inputCardCodes.filter((code) => !queriedCodes.includes(code));
      if (invalidCodes.length > 0) {
        const formattedCodes = invalidCodes.map((code) => `\`${code}\``).join(", ");
        return interaction.editReply({ content: `The following card codes are invalid or do not exist: ${formattedCodes}` });
      }

      // Verify ownership of cards
      const unownedCodes = queriedCards.filter((card) => card.ownerID !== interaction.user.id).map((card) => card.code);
      if (unownedCodes.length > 0) {
        const formattedCodes = unownedCodes.map((code) => `\`${code}\``).join(", ");
        return interaction.editReply({ content: `The following cards are not owned by you: ${formattedCodes}` });
      }

      // Update cards with the new tag and emoji
      await CardModel(client).updateMany(
        {
          // Filter
          ownerID: interaction.user.id,
          code: { $in: inputCardCodes },
        },
        {
          // Update
          $set: {
            tag: tag,
            emoji: emoji,
          },
        }
      );

      if (inputCardCodes.length > 1) {
        interaction.editReply({ content: `Successfully tagged ${inputCardCodes.length} cards.` });
      } else {
        interaction.editReply({ content: `Successfully tagged **${queriedCards[0].character}**.` });
      }
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: `There was an issue tagging ${inputCardCodes > 1 ? "those cards" : "that card"}. Please try again.` });
    }
  },
};
