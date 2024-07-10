const { SlashCommandBuilder } = require("discord.js");
const { replaceAccents } = require("../../utils/stringUtils");
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

      const reply = [];
      for (const r of results) {
        reply.push(`\`${r.wishlist}\` ${r.series} ${r.character}`);
      }
      interaction.reply(reply.join("\n"));
    }

    interaction.reply("WIP")
  },
};

function lookup(query, searchMap) {
  const queryWords = replaceAccents(query)
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "")
    .split(/[\s,]+/);

  const matchedCharacters = [];
  queryWords.forEach((word) => {
    if (searchMap[word]) {
      searchMap[word].forEach(({ character, series, wishlist }) => {
        const i = matchedCharacters.findIndex((entry) => entry.character === character && entry.series === series);

        if (i === -1) {
          matchedCharacters.push({ character, series, wishlist, count: 1 });
        } else {
          matchedCharacters[i].count++;
        }
      });
    }
  });

  return matchedCharacters.sort((a, b) => {
    return a.wishlist - b.wishlist || a.series.localeCompare(b.series) || a.character.localeCompare(b.character);
  });
}
