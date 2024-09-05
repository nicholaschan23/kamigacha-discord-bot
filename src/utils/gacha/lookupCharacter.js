const { replaceAccents } = require("../stringUtils");

function lookup(query, searchMap) {
  const queryWords = replaceAccents(query)
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/gi, "")
    .split(/[\s,]+/);

  let maxCount = 0;
  const matchedCharacters = [];
  queryWords.forEach((word) => {
    if (searchMap[word]) {
      searchMap[word].forEach(({ character, series, wishCount }) => {
        let i = matchedCharacters.findIndex((entry) => entry.character === character && entry.series === series);

        if (i === -1) {
          matchedCharacters.push({
            character: character,
            series: series,
            wishCount: wishCount,
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
      return b.wishCount - a.wishCount || a.series.localeCompare(b.series) || a.character.localeCompare(b.character);
    });
}

module.exports = { lookup };
