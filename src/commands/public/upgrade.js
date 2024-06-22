const { SlashCommandBuilder } = require("discord.js");
const CardModel = require("../../database/mongodb/models/card/card");
const CardUpgrader = require("../../utils/gacha/CardUpgrader");
const upgradePreviewEmbed = require("../../assets/embeds/upgrade/upgradePreview")

module.exports = {
  category: "public",
  data: new SlashCommandBuilder()
    .setName("upgrade")
    .setDescription("Combine 10 cards to upgrade into a higher rarity card.")
    .addStringOption((option) => option.setName("codes").setDescription("10 card codes separated with spaces or commas.").setRequired(true)),

  async execute(client, interaction) {
    await interaction.deferReply();

    // Initialize variables
    const inputString = interaction.options.getString("codes").toLowerCase();
    const inputCardCodes = inputString.split(/[\s,]+/).filter((code) => code);

    // Verify 10 card codes were entered
    if (inputCardCodes.length != 10) {
      return interaction.editReply({ content: `Please enter exactly 10 card codes separated with spaces or commas. Found ${inputCardCodes.length}.`, ephemeral: true });
    }

    // Fetch the cards from the database based on the provided card codes
    const queriedCards = await CardModel(client).find({
      code: { $in: inputCardCodes },
    });

    // Identify invalid or missing card codes
    const queriedCodes = queriedCards.map((card) => card.code);
    const invalidCodes = inputCardCodes.filter((code) => !queriedCodes.includes(code));
    if (invalidCodes.length > 0) {
      const formattedCodes = invalidCodes.map((code) => `\`${code}\``).join(", ");
      return interaction.editReply({ content: `The following card codes are invalid or do not exist: ${formattedCodes}`, ephemeral: true });
    }

    // Verify ownership of cards
    const unownedCodes = queriedCards.filter((card) => card.ownerID !== interaction.user.id).map((card) => card.code);
    if (unownedCodes.length > 0) {
      const formattedCodes = unownedCodes.map((code) => `\`${code}\``).join(", ");
      return interaction.editReply({ content: `The following cards are not owned by you: ${formattedCodes}`, ephemeral: true });
    }

    // SSR cards cannot be upgraded
    const SSRCodes = queriedCards.filter((card) => card.rarity == "SSR").map((card) => card.code);
    if (SSRCodes.length > 0) {
      const formattedCodes = SSRCodes.map((code) => `\`${code}\``).join(", ");
      return interaction.editReply({ content: `The following SSR cards are already the highest rarity and cannot be further upgraded: ${formattedCodes}`, ephemeral: true });
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

    // Display upgrade preview
    await interaction.editReply({ embeds: [upgradePreviewEmbed(queriedCards, seriesSetFreq, rarityFreq)] });

    // const cu = new CardUpgrader(client, queriedCards);
    // await cu.cardUpgrade();

    // const ownedCards = await CardModel(client).find({
    //   code: { $in: queriedCodes },
    //   ownerID: this.userID,
    // });
  },
};
