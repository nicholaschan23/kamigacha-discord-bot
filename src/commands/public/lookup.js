const { SlashCommandBuilder } = require("discord.js");
const { lookup } = require("../../utils/gacha/lookupCharacter");
const CardModel = require("../../database/mongodb/models/card/card");
const LookupPages = require("../../utils/pages/LookupPages");
const LookupCharacterPages = require("../../utils/pages/LookupCharacterPages");
const CollectionModel = require("../../database/mongodb/models/card/collection");
const Logger = require("../../utils/Logger");
const logger = new Logger("Lookup command");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder()
    .setName("lookup")
    .setDescription("Find info on a character's available cards.")
    .addStringOption((option) =>
      option.setName("character").setDescription("Search by card code, character, or series name. Omit to lookup your latest card.")
    ),

  async execute(client, interaction) {
    const character = interaction.options.getString("character");

    if (character) {
      const results = lookup(character, client.jsonSearches);

      // No results
      if (results.length === 0) {
        // Check if input was a card code
        const cardDocument = await CardModel.findOne({ code: character });

        // Card code exists
        if (cardDocument) {
          await LCPCardDocument(interaction, cardDocument);
          return;
        }

        // No results from lookup and from card code search
        return interaction.reply("That character could not be found. It may not exist, or you may have misspelled their name.");
      }

      // If exactly 1 result, go straight to character stat page
      if (results.length === 1) {
        const bp = new LookupCharacterPages(
          interaction,
          JSON.stringify({
            character: results[0].character,
            series: results[0].series,
          })
        );
        await bp.init();
        await bp.createPages();
        bp.publishPages();
        return;
      }

      const bp = new LookupPages(interaction, results);
      bp.createPages();
      bp.publishPages();
    } else {
      await interaction.deferReply();

      // Retrieve latest card in collection and perform lookup
      try {
        const collectionDocument = await CollectionModel.findOne(
          { userId: interaction.user.id },
          { cardsOwned: { $slice: -1 } } // Only retrieve the first element in the cardsOwned array
        );

        const cardId = collectionDocument?.cardsOwned[0];
        if (!cardId) {
          return interaction.editReply("Something went wrong retrieving your latest card. Please try again.");
        }

        const cardDocument = await CardModel.findById(cardId);
        if (!cardDocument) {
          return interaction.editReply("Something went wrong retrieving your latest card. Please try again.");
        }

        await LCPCardDocument(interaction, cardDocument, true);
        return;
      } catch (err) {
        logger.error(err);
        return interaction.editReply("Something went wrong retrieving your latest card. Please try again.");
      }
    }
  },
};

/**
 * Helper function to show lookup character page from card document
 * @param {} interaction Discord interaction
 * @param {CardModel} cardDocument CardModel document from database
 * @param {Boolean} isDeferred If message was already deferred, edit it
 */
async function LCPCardDocument(interaction, cardDocument, isDeferred = false) {
  // Create lookup character page
  const bp = new LookupCharacterPages(
    interaction,
    JSON.stringify({
      character: cardDocument.character,
      series: cardDocument.series,
    })
  );

  await bp.init();

  // Choose which set to start on based on card info
  bp.set = `${cardDocument.set}`;
  await bp.createPages();

  // Choose which page to start on based on card info
  if (bp.pages.length !== 1) {
    bp.index = bp.rarityArray.indexOf(cardDocument.rarity);
  }

  bp.publishPages(isDeferred);
}
