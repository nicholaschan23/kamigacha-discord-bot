const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require("discord.js");
const config = require("@config");
const MapCache = require("@database/redis/cache/map");
const CardModel = require("@database/mongodb/models/card/card");
const Logger = require("@utils/Logger");
const CardUpgrader = require("@utils/gacha/CardUpgrader");
const { isValidCode } = require("@utils/string/validation");
const { formatCardInfo } = require("@utils/string/format");
const { formatCardInfoPage } = require("@utils/string/formatPage");
const { generateCardAttachment } = require("@graphics/generateCardAttachment");

const logger = new Logger("Upgrade command");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder()
    .setName("upgrade")
    .setDescription("Combine 10 cards to upgrade into a higher rarity card.")
    .addStringOption((option) => option.setName("codes").setDescription("10 card codes.").setRequired(true)),

  async execute(client, interaction) {
    await interaction.deferReply();

    // Initialize variables
    const inputString = interaction.options.getString("codes").toLowerCase();
    const inputCardCodes = inputString.split(/[\s,]+/).filter((code) => code);

    // Verify 10 card codes were entered
    if (inputCardCodes.length != 10) {
      return interaction.editReply({ content: `Please enter exactly 10 cards separated with spaces or commas (entered ${inputCardCodes.length}).` });
    }

    // Identify invalid card codes
    const invalidCodes = inputCardCodes.filter((code) => !isValidCode(code));
    if (invalidCodes.length > 0) {
      const formattedCodes = invalidCodes.map((code) => `\`${code}\``).join(", ");
      return interaction.editReply({ content: `The following card codes are invalid: ${formattedCodes}` });
    }

    // Fetch the cards from the database based on the provided card codes
    const queriedCards = await CardModel.find({
      code: { $in: inputCardCodes },
    });

    // Identify invalid or missing card codes
    const queriedCodes = queriedCards.map((card) => card.code);
    const invalidMissingCodes = inputCardCodes.filter((code) => !queriedCodes.includes(code));
    if (invalidMissingCodes.length > 0) {
      const formattedCodes = invalidMissingCodes.map((code) => `\`${code}\``).join(", ");
      return interaction.editReply({ content: `The following card codes are invalid or do not exist: ${formattedCodes}` });
    }

    // Verify ownership of cards
    const unownedCodes = queriedCards.filter((card) => card.ownerId !== interaction.user.id).map((card) => card.code);
    if (unownedCodes.length > 0) {
      const formattedCodes = unownedCodes.map((code) => `\`${code}\``).join(", ");
      return interaction.editReply({ content: `The following cards are not owned by you: ${formattedCodes}` });
    }

    // SSR cards cannot be upgraded
    const SSRCodes = queriedCards.filter((card) => card.rarity == "SSR").map((card) => card.code);
    if (SSRCodes.length > 0) {
      const formattedCodes = SSRCodes.map((code) => `\`${code}\``).join(", ");
      return interaction.editReply({ content: `The following SSR cards are already the highest rarity and cannot be further upgraded: ${formattedCodes}` });
    }

    // Verify all cards have an upgrade rarity
    const noUpgradeCodes = [];
    await Promise.all(
      queriedCards.map(async (card) => {
        const seriesModel = await MapCache.getMapEntry("card-model-map", card.series);
        const nextRarity = config.getNextRarity(card.rarity);
        if (seriesModel[card.set][nextRarity] === null) noUpgradeCodes.push(card.code);
      })
    );
    if (noUpgradeCodes.length > 0) {
      const formattedCodes = noUpgradeCodes.map((code) => `\`${code}\``).join(", ");
      return interaction.editReply({ content: `The following cards are the highest rarity in their set and cannot be further upgraded: ${formattedCodes}` });
    }

    // Count frequency of card stats
    const seriesSetFreq = {};
    const rarityFreq = {};
    for (const card of queriedCards) {
      // Initialize the nested structure if it doesn't exist
      if (!seriesSetFreq[card.series]) {
        seriesSetFreq[card.series] = {};
      }

      // Update the frequency for the series-set pair
      seriesSetFreq[card.series][card.set] = (seriesSetFreq[card.series][card.set] || 0) + 1;

      // Update the frequency for the rarity
      rarityFreq[card.rarity] = (rarityFreq[card.rarity] || 0) + 1;
    }

    // Create message to send
    const embed = await getUpgradePreviewEmbed(queriedCards, seriesSetFreq, rarityFreq);
    embed.setColor(config.embedColor.yellow);
    const cancelButton = new ButtonBuilder().setCustomId("rejectUpgrade").setEmoji("❌").setStyle(ButtonStyle.Secondary);
    const acceptButton = new ButtonBuilder().setCustomId("acceptUpgrade").setEmoji("🔨").setStyle(ButtonStyle.Secondary);
    const row = new ActionRowBuilder().addComponents(cancelButton, acceptButton);

    // Display upgrade preview and wait for a response
    const previewMessage = await interaction.editReply({ embeds: [embed], components: [row] });
    const collector = previewMessage.createMessageComponentCollector({ time: 60_000 });

    // Handle the button interactions
    collector.on("collect", async (i) => {
      if (i.user.id !== interaction.user.id) return await i.deferUpdate();

      try {
        if (i.customId === "rejectUpgrade") {
          embed.setColor(config.embedColor.red);
          i.update({ embeds: [embed], components: [] });
        } else if (i.customId === "acceptUpgrade") {
          // Upgrade card
          const cu = new CardUpgrader(interaction.guild.id, queriedCards, seriesSetFreq, rarityFreq);
          try {
            const createdCard = await cu.cardUpgrade();
            if (createdCard) {
              embed.setColor(config.embedColor.green);
              i.update({ embeds: [embed], components: [] });

              const cardInfo = await formatCardInfo(createdCard);
              const { file, url } = await generateCardAttachment(createdCard);
              interaction.reply({
                embeds: [
                  new EmbedBuilder()
                    .setTitle("Upgrade")
                    .setDescription(`Owned by ${interaction.user}\n` + `\n` + `${cardInfo}`)
                    .setImage(url)
                    .setColor(config.embedColor.green),
                ],
                files: [file],
              });
              const { embed: upgradeEmbed, file: upgradeFile } = await viewUpgradeEmbed(createdCard);

              i.channel.send({ embeds: [upgradeEmbed], files: [upgradeFile] });
            } else {
              embed.setColor(config.embedColor.red);
              i.update({ embeds: [embed], components: [] });
              i.channel.send({ content: "Upgrade failed." });
            }
          } catch (error) {
            if (config.debug) logger.error(error.stack);
            embed.setColor(config.embedColor.red);
            i.update({ embeds: [embed], components: [] });
            i.channel.send({ content: error.message });
          }
        }
        collector.stop();
      } catch (error) {
        if (config.debug) return logger.error(error.stack);
      }
    });

    collector.on("end", async (collected, reason) => {
      if (reason === "time") {
        embed.setColor(config.embedColor.red);
        await previewMessage.edit({ embeds: [embed], components: [] });
      }
    });
  },
};

async function getUpgradePreviewEmbed(queriedCards, seriesSetFreq, rarityFreq) {
  // Format text for series chances
  const seriesChances = [];
  for (const series in seriesSetFreq) {
    for (const set in seriesSetFreq[series]) {
      const freq = seriesSetFreq[series][set];
      const formattedSeries = await MapCache.getFormattedSeries(series);
      seriesChances.push([`${freq * 10}%`, `◈${set}`, `${formattedSeries}`].join(" · "));
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

  const cardInfo = await formatCardInfoPage(queriedCards);
  return new EmbedBuilder()
    .setTitle("Upgrade Preview")
    .addFields(
      {
        name: "Cards Inputted",
        value: cardInfo,
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
}
