const { SlashCommandBuilder } = require("discord.js");
const { lookup } = require("../../utils/gacha/lookupCharacter");
const LookupButtonPages = require("../../utils/pages/LookupButtonPages");
const CollectionModel = require("../../database/mongodb/models/card/collection");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder()
    .setName("lookup")
    .setDescription("Find info on a character's available cards.")
    .addStringOption((option) => option.setName("character").setDescription("Search by character and series name. Omit to lookup your latest card.")),

  async execute(client, interaction) {
    const character = interaction.options.getString("character");

    if (character) {
      const results = lookup(character, client.jsonSearches);

      // No results
      if (results.length == 0) {
        return interaction.reply("That character could not be found. It may not exist, or you may have misspelled their name.");
      }

      const bp = new LookupButtonPages(interaction, results);
      bp.publishPages();
    } else {
      await interaction.deferReply();

      // Retrieve latest card in collection
      try {
        const collectionDocument = await CollectionModel().findOne(
          { userId: interaction.user.id },
          { cardsOwned: { $slice: -1 } } // Only retrieve the first element in the cardsOwned array
        );

        const cardId = collectionDocument?.cardsOwned[0];
        if (!cardId) {
          return interaction.editReply("Something went wrong retrieving your latest card. Please try again.");
        }

        const cardDocument = await CardModel().findById(cardId);
        if (!cardDocument) {
          return interaction.editReply("Something went wrong retrieving your latest card. Please try again.");
        }

        // Found card, pull up stats
        const character = cardDocument.character;
        const series = cardDocument.series;
      } catch {
        return interaction.editReply("Something went wrong retrieving your latest card. Please try again.");
      }
    }
  },
};
