const { SlashCommandBuilder } = require("discord.js");
const { replaceAccents } = require("../../utils/stringUtils");
const LookupButtonPages = require("../../utils/pages/LookupButtonPages");
const config = require("../../config");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder()
    .setName("lookup")
    .setDescription("Find info on a character's available cards.")
    .addStringOption((option) => option.setName("search").setDescription("Search by character and series name. Omit to lookup your latest card.")),

  async execute(client, interaction) {
    const search = interaction.options.getString("search");

    if (search) {
      const results = lookup(search, client.jsonSearches);

      // No results
      if (results.length == 0) {
        return interaction.reply("That character could not be found. It may not exist, or you may have misspelled their name.");
      }

      const bp = new LookupButtonPages(interaction, results);
      bp.publishPages();
    } else {
      interaction.reply("WIP");
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
