const { EmbedBuilder } = require("discord.js");
const { formatCardInfoPage } = require("../../../utils/gacha/format");
const config = require("../../../config");

module.exports = (queriedCards, seriesSetFreq, rarityFreq) => {
  // Format text for series chances
  const seriesChances = [];
  for (const series in seriesSetFreq) {
    for (const set in seriesSetFreq[series]) {
      const freq = seriesSetFreq[series][set];
      seriesChances.push([`${freq * 10}%`, `◈${set}`, `${series}`].join(" · "));
    }
  }

  // Format text for rarity chances and get total fail chance
  const rarityChances = [];
  let failChance = 0;
  for (const rarity in rarityFreq) {
    const freq = rarityFreq[rarity];
    rarityChances.push([`${freq * 10}%`, `${config.getNextRarity(rarity)}`].join(" · "));
    failChance += freq * config.upgradeFailRate[rarity];
  }
  const successRate = 100 - failChance;

  // Colored formatting
  const getColoredRateText = (rate) => {
    let color;
    const divisions = (100 - config.upgradeFailRate["SR"] * 10) / 3;
    if (rate >= 100 - divisions) {
      color = 32; // Green
    } else if (rate >= 100 - divisions * 2) {
      color = 33; // Yellow
    } else {
      color = 31; // Red
    }
    return `\`\`\`ansi\n\u001b[0;${color}m${successRate}%\u001b[0;0m\`\`\``;
  };

  return new EmbedBuilder()
    .setTitle("Upgrade Preview")
    .addFields(
      {
        name: "Cards Inputted",
        value: formatCardInfoPage(queriedCards),
      },
      {
        name: "Series Chances",
        value: `\`\`\`prolog\n${seriesChances.join("\n")}\`\`\``,
      },
      {
        name: "Rarity Chances",
        value: `\`\`\`prolog\n${rarityChances.join("\n")}\`\`\``,
        inline: true,
      },
      {
        name: "Success Rate",
        value: getColoredRateText(successRate),
        inline: true,
      }
    )
    .setFooter({ text: "Use /help upgrade for details" });
};
