const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const CardModel = require("../../database/mongodb/models/card/card");
const CardUpgrader = require("../../utils/gacha/CardUpgrader");
const upgradePreviewEmbed = require("../../assets/embeds/upgrade/upgradePreview");
const viewUpgradeEmbed = require("../../assets/embeds/upgrade/viewUpgrade");
const config = require("../../config");
const { isValidCode } = require("../../utils/string/validation");
const Logger = require("../../utils/Logger");
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
    const queriedCards = await CardModel().find({
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
    const noUpgradeCodes = queriedCards
      .filter((card) => {
        const nextRarity = config.getNextRarity(card.rarity);
        return !client.jsonCards[card.series][card.set][nextRarity];
      })
      .map((card) => card.code);
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
    const embed = upgradePreviewEmbed(queriedCards, seriesSetFreq, rarityFreq);
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
          await i.update({ embeds: [embed], components: [] });
        } else if (i.customId === "acceptUpgrade") {
          // Upgrade card
          const cu = new CardUpgrader(client, interaction.guild.id, queriedCards, seriesSetFreq, rarityFreq);
          try {
            const createdCard = await cu.cardUpgrade();
            if (createdCard) {
              embed.setColor(config.embedColor.green);
              await i.update({ embeds: [embed], components: [] });
              const { embed: upgradeEmbed, file: upgradeFile } = await viewUpgradeEmbed(createdCard);
              await interaction.followUp({ embeds: [upgradeEmbed], files: [upgradeFile] });
            } else {
              embed.setColor(config.embedColor.red);
              await i.update({ embeds: [embed], components: [] });
              await interaction.followUp({ content: "Upgrade failed." });
            }
          } catch (error) {
            if (config.debug) logger.error(error.stack);
            embed.setColor(config.embedColor.red);
            await i.update({ embeds: [embed], components: [] });
            await interaction.followUp({ content: error.message });
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
