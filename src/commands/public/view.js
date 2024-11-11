const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const CardModel = require("@database/mongodb/models/card/card");
const CollectionModel = require("@database/mongodb/models/card/collection");
const { formatCardInfo } = require("@utils/string/format");
const { generateCardAttachment } = require("@graphics/generateCardAttachment");

module.exports = {
  category: "public",
  data: new SlashCommandBuilder()
    .setName("view")
    .setDescription("View a card.")
    .addStringOption((option) => option.setName("code").setDescription("Card code. (Default: latest card)")),

  async execute(client, interaction) {
    // Function to retrieve card and send the response
    const sendCardReply = async (cardDocument) => {
      if (cardDocument) {
        const cardInfo = await formatCardInfo(cardDocument);
        const { file, url } = await generateCardAttachment(cardDocument);

        const embed = new EmbedBuilder()
          .setTitle("Card Details")
          .setDescription(`Owned by <@${cardDocument.ownerId}>\n` + `\n` + `${cardInfo}`)
          .setImage(url);
        interaction.reply({ embeds: [embed], files: [file] });
        return;
      }
      interaction.reply({ content: "That card could not be found.", ephemeral: true });
      return;
    };

    // Retrieve card by code if provided
    const code = interaction.options.getString("code")?.toLowerCase();
    if (code) {
      const cardDocument = await CardModel.findOne({ code: code });
      return sendCardReply(cardDocument);
    }

    // Retrieve latest card from the user's collection
    const collectionDocument = await CollectionModel.findOne(
      { userId: interaction.user.id },
      { cardsOwned: { $slice: -1 } } // Retrieve the most recent card
    );
    const cardId = collectionDocument?.cardsOwned[0];
    if (!cardId) {
      return interaction.reply({ content: "Something went wrong retrieving your latest card. Please try again.", ephemeral: true });
    }
    const cardDocument = await CardModel.findById(cardId);
    return sendCardReply(cardDocument);
  },
};
