const { SlashCommandBuilder } = require("discord.js");
const { replaceAccents } = require("../../utils/stringUtils");
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

        // Found card, pull up stats
        const character = cardDocument.character;
        const series = cardDocument.series;
      } catch {
        return interaction.editReply("Something went wrong retrieving your latest card. Please try again.");
      }
    }
  },
};

function lookup(query, searchMap) {
  const queryWords = replaceAccents(query)
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "")
    .split(/[\s,]+/);

  let maxCount = 0;
  const matchedCharacters = [];
  queryWords.forEach((word) => {
    if (searchMap[word]) {
      searchMap[word].forEach(({ character, series, wishlist }) => {
        let i = matchedCharacters.findIndex((entry) => entry.character === character && entry.series === series);

        if (i === -1) {
          matchedCharacters.push({
            character: character,
            series: series,
            wishlist: wishlist,
            count: 1,
          });
          i = matchedCharacters.length - 1;
        } else {
          matchedCharacters[i].count++;
        }

        if (matchedCharacters[i].count > maxCount) {
          maxCount = matchedCharacters[i].count;
        }
      });
    }
  });

  return matchedCharacters
    .filter((characters) => characters.count === maxCount)
    .sort((a, b) => {
      return b.wishlist - a.wishlist || a.series.localeCompare(b.series) || a.character.localeCompare(b.character);
    });
}
