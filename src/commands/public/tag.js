const { SlashCommandBuilder } = require("discord.js");
const CardModel = require("../../database/mongodb/models/card/card");
const CollectionModel = require("../../database/mongodb/models/card/collection");
const TagModel = require("../../database/mongodb/models/user/tag");
const { isValidTag } = require("../../utils/gacha/format");
const Logger = require("../../utils/Logger");
const logger = new Logger("Tag command");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder()
    .setName("tag")
    .setDescription("Tag cards in your collection.")
    .addStringOption((option) => option.setName("tag").setDescription('Name of tag. Use "none" to untag.').setRequired(true))
    .addStringOption((option) => option.setName("cards").setDescription("Card codes to associate with this tag. Omit to tag your latest card.")),

  async execute(client, interaction) {
    await interaction.deferReply();

    // Get tag and emoji
    const tag = interaction.options.getString("tag").toLowerCase();
    let emoji = "▪️";
    if (tag !== "none") {
      if (!isValidTag(tag)) {
        return interaction.editReply({ content: "That tag does not exist." });
      }

      // Check if tag exists
      const tagDocument = await TagModel(client).findOne(
        { userId: interaction.user.id } // Filter
      );
      if (!tagDocument.tagList.get(tag)) {
        return interaction.editReply({ content: "That tag does not exist." });
      }
      emoji = tagDocument.tagList.get(tag).emoji;
    }

    // Retrieve card codes
    let inputString = interaction.options.getString("cards")?.toLowerCase();
    if (!inputString) {
      // Retrieve latest card in collection
      try {
        const collectionDocument = await CollectionModel(client).findOne(
          { userId: interaction.user.id },
          { cardsOwned: { $slice: -1 } } // Only retrieve the first element in the cardsOwned array
        );

        const cardId = collectionDocument?.cardsOwned[0];
        if (!cardId) {
          return interaction.editReply("Something went wrong retrieving your latest card. Please try again.");
        }

        const cardDocument = await CardModel(client).findById(cardId);
        if (!cardDocument) {
          return interaction.editReply("Something went wrong retrieving your latest card. Please try again.");
        }

        inputString = cardDocument.code;
      } catch (error) {
        return interaction.editReply("Something went wrong retrieving your latest card. Please try again.");
      }
    }

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
      const unownedCodes = queriedCards.filter((card) => card.ownerId !== interaction.user.id).map((card) => card.code);
      if (unownedCodes.length > 0) {
        const formattedCodes = unownedCodes.map((code) => `\`${code}\``).join(", ");
        return interaction.editReply({ content: `The following cards are not owned by you: ${formattedCodes}` });
      }

      // Get frequency of cards being updated with this tag
      const incOperations = {};

      // Helper function to increment or decrement tag quantities
      function updateTagQuantity(tag, amount) {
        if (!incOperations[`tagList.${tag}.quantity`]) {
          incOperations[`tagList.${tag}.quantity`] = amount;
        } else {
          incOperations[`tagList.${tag}.quantity`] += amount;
        }
      }

      // Iterate over queried cards to update tag quantities
      for (const card of queriedCards) {
        if (card.tag === tag) {
          continue;
        }

        if (tag === "none") {
          // Decrement the quantity of the card's current tag
          updateTagQuantity(card.tag, -1);
        } else if (card.tag === "none") {
          // Increment the quantity of the new tag
          updateTagQuantity(tag, 1);
        } else {
          // Decrement the quantity of the card's current tag
          updateTagQuantity(card.tag, -1);
          // Increment the quantity of the new tag
          updateTagQuantity(tag, 1);
        }
      }

      // Update quantity of cards in tags
      await TagModel(client).findOneAndUpdate(
        { userId: interaction.user.id }, // Filter
        { $inc: incOperations } // Update operation
      );

      // Update cards with the new tag and emoji
      await CardModel(client).updateMany(
        {
          // Filter
          ownerId: interaction.user.id,
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
        interaction.editReply({ content: `Successfully ${tag === "none" ? "untagged" : "tagged"} ${inputCardCodes.length} cards!` });
      } else {
        interaction.editReply({ content: `Successfully ${tag === "none" ? "untagged" : "tagged"} **${queriedCards[0].character}**!` });
      }
    } catch (error) {
      logger.error(error.stack);
      interaction.editReply({ content: `There was an issue tagging ${inputCardCodes > 1 ? "those cards" : "that card"}. Please try again.` });
    }
  },
};
