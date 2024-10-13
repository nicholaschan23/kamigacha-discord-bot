const { SlashCommandBuilder } = require("discord.js");
const CardModel = require("@database/mongodb/models/card/card");
const CollectionModel = require("@database/mongodb/models/card/collection");
const Logger = require("@utils/Logger");
const LookupCharacterPages = require("@utils/pages/lookup/LookupCharacterPages");
const LookupPages = require("@utils/pages/lookup/LookupPages");
const { lookup } = require("@utils/gacha/lookup");

const logger = new Logger("Lookup command");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder()
    .setName("lookup")
    .setDescription("Find info on a character's available cards.")
    .addStringOption((option) => option.setName("search").setDescription("Search by card code, character, or series name. Omit to lookup your latest card.")),

  async execute(client, interaction) {
    const search = interaction.options.getString("search");

    if (search) {
      const [characterResults, seriesResults] = await lookup(search);

      // No results
      if (characterResults.length === 0) {
        // Check if input was a card code
        const cardDocument = await CardModel.findOne({ code: search });

        // Card code exists
        if (cardDocument) {
          await LCPCardDocument(interaction, cardDocument);
          return;
        }

        // No results from lookup and from card code search
        interaction.reply("That character could not be found. It may not exist, or you may have misspelled their name.");
        return;
      }

      // If exactly 1 result, go straight to character stat page
      if (characterResults.length === 1) {
        const bp = new LookupCharacterPages(
          interaction,
          JSON.stringify({
            character: characterResults[0].character,
            series: characterResults[0].series,
          })
        );
        await bp.init();
        await bp.createPages();
        bp.publishPages();
        return;
      }

      const bp = new LookupPages(interaction, characterResults, seriesResults);
      await bp.createPages();
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
          interaction.editReply("Something went wrong retrieving your latest card. Please try again.");
          return;
        }

        const cardDocument = await CardModel.findById(cardId);
        if (!cardDocument) {
          interaction.editReply("Something went wrong retrieving your latest card. Please try again.");
          return;
        }

        await LCPCardDocument(interaction, cardDocument, true);
        return;
      } catch (err) {
        logger.error(err);
        interaction.editReply("Something went wrong retrieving your latest card. Please try again.");
        return;
      }
    }
  },
};

/**
 * Helper function to show lookup character page from card document
 * @param {interaction} interaction Discord interaction
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
