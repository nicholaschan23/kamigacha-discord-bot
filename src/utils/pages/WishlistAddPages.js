const LookupButtonPages = require("./LookupButtonPages");
const WishlistModel = require("../../database/mongodb/models/user/wishlist");
const CharacterModel = require("../../database/mongodb/models/global/character");
const config = require("../../config");
const client = require("../../../bot");

class WishlistAddButtonPages extends LookupButtonPages {
  constructor(interaction, pageData) {
    super(interaction, pageData);
  }

  async handleSelect(interaction, value) {
    const embed = this.pages[this.index];
    const data = JSON.parse(value);

    // Save document
    const characterToAdd = { character: data.character, series: data.series };
    const wishlistDocument = await WishlistModel().findOneAndUpdate(
      {
        userId: interaction.user.id,
        wishlist: { $not: { $elemMatch: characterToAdd } },
      }, // Filter
      {
        $push: {
          wishlist: {
            $each: characterToAdd,
            $sort: { series: 1, character: 1 },
          },
        },
      }, // Update
      { new: true }
    );

    // Prevent duplicate wishlist entries
    if (!wishlistDocument) {
      embed.setColor(config.embedColor.red);
      this.collector.stop();
      return await interaction.followUp({ content: `**${client.characterNameMap[data.character]}** from ${client.seriesNameMap[data.series]} is already on your wishlist.` });
    }

    // Add wishlist amount from character
    const characterDocument = await CharacterModel().findOneAndUpdate(
      {
        character: data.character,
        series: data.series,
      }, // Filter
      { $inc: { wishlist: 1 } },
      { new: true } // Options
    );

    // Update message
    if (!characterDocument) {
      embed.setColor(config.embedColor.red);
      this.collector.stop();
      return await interaction.followUp({ content: "There was an issue adding to your wishlist. Please try again." });
    }
    embed.setColor(config.embedColor.green);
    this.collector.stop();
    return await interaction.followUp({ content: `Successfully added **${client.characterNameMap[data.character]}** from ${client.seriesNameMap[data.series]} to your wishlist!` });
  }
}

module.exports = WishlistAddButtonPages;
