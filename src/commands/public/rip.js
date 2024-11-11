const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const config = require("@config");
const CardModel = require("@database/mongodb/models/card/card");
const CollectionModel = require("@database/mongodb/models/card/collection");
const InventoryModel = require("@database/mongodb/models/user/inventory");
const { calculateRipValue } = require("@utils/gacha/calculateRipValue");
const { generateCardAttachment } = require("@graphics/generateCardAttachment");
const { formatInventoryPage } = require("@utils/string/formatPage");
const { isValidCode } = require("@utils/string/validation");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder()
    .setName("rip")
    .setDescription("Turn a card into materials for crafting.")
    .addStringOption((option) => option.setName("code").setDescription("Card code to rip. (Default: latest card)")),

  async execute(client, interaction) {
    await interaction.deferReply();

    let cardDocument;
    const code = interaction.options.getString("code")?.toLowerCase();
    if (code) {
      if (!isValidCode(code)) {
        interaction.editReply({ content: "Invalid card code.", ephemeral: true });
        return;
      }

      // Retrieve card by code if provided
      cardDocument = await CardModel.findOne({ code: code });
      if (!cardDocument) {
        interaction.editReply({ content: "That card could not be found.", ephemeral: true });
        return;
      }
    } else {
      // Retrieve latest card from the user's collection
      const collectionDocument = await CollectionModel.findOne({ userId: interaction.user.id }, { cardsOwned: { $slice: -1 } });

      const cardId = collectionDocument?.cardsOwned[0];
      if (!cardId) {
        interaction.editReply({ content: "You have no cards.", ephemeral: true });
        return;
      }

      cardDocument = await CardModel.findById(cardId);
    }
    const card = cardDocument;

    // Create message to send
    const { file, url } = await generateCardAttachment(card);
    const items = await calculateRipValue(card); // Array of Item objects
    const formattedItems = formatInventoryPage(items, { itemCode: false });

    const embed = new EmbedBuilder()
      .setTitle("Rip Card")
      .setDescription(`${interaction.user}, you will receive:\n\n` + formattedItems)
      .setThumbnail(url);
    embed.setColor(config.embedColor.yellow);
    const cancelButton = new ButtonBuilder().setCustomId("cancel").setEmoji("❌").setStyle(ButtonStyle.Secondary);
    const ripButton = new ButtonBuilder().setCustomId("rip").setEmoji("✂️").setStyle(ButtonStyle.Secondary);
    const row = new ActionRowBuilder().addComponents(cancelButton, ripButton);

    // Send message and wait for a response
    const message = await interaction.editReply({ embeds: [embed], files: [file], components: [row], fetchReply: true });
    const collector = message.createMessageComponentCollector({ filter: (i) => i.user.id === interaction.user.id, time: 60_000 });

    // Handle the button interactions
    collector.on("collect", async (i) => {
      if (i.customId === "cancel") {
        embed.setColor(config.embedColor.red);
      } else if (i.customId === "rip") {
        const session = await CardModel.startSession();
        session.startTransaction();

        try {
          // Remove card from user's collection
          await CollectionModel.updateOne({ userId: interaction.user.id }, { $pull: { cardsOwned: card._id } }, { session: session });

          await CardModel.deleteOne({ _id: card._id }, { session: session });

          // Add items to user's inventory
          for (const item of items) {
            await InventoryModel.updateOne(
              { userId: interaction.user.id },
              { $inc: { [`inventory.${item.name}`]: item.quantity } },
              { upsert: true, session: session }
            );
          }

          // Commit the transaction
          await session.commitTransaction();
          embed.setColor(config.embedColor.green).setFooter({ text: `The card is torn.` });
        } catch (error) {
          embed.setColor(config.embedColor.red).setFooter({ text: `The card was not torn.` });
          await session.abortTransaction();
          console.error("Transaction error:", error);
        } finally {
          session.endSession();
        }
      }

      await i.update({ embeds: [embed], components: [] });
      collector.stop();
    });

    collector.on("end", async (collected, reason) => {
      if (reason === "time") {
        embed.setColor(config.embedColor.red);
        await message.edit({ embeds: [embed], components: [] });
      }
    });
  },
};
