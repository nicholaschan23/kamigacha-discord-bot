const LookupPages = require("./LookupPages");
const WishModel = require("../../database/mongodb/models/user/wish");
const CharacterModel = require("../../database/mongodb/models/global/character");
const config = require("../../config");
const client = require("../../../bot");

class WishListAddButtonPages extends LookupPages {
  constructor(interaction, pageData) {
    super(interaction, pageData);
  }

  async handleSelect(interaction, value) {
    const embed = this.pages[this.index];
    const data = JSON.parse(value);

    // Save document
    const characterToAdd = { character: data.character, series: data.series };
    const wishDocument = await WishModel().findOneAndUpdate(
      {
        userId: interaction.user.id,
        wishList: { $not: { $elemMatch: characterToAdd } },
      }, // Filter
      {
        $push: {
          wishList: {
            $each: [characterToAdd],
            $sort: { series: 1, character: 1 },
          },
        },
      }, // Update
      { new: true }
    );

    // Prevent duplicate wish list entries
    if (!wishDocument) {
      embed.setColor(config.embedColor.red);
      this.collector.stop();
      return await interaction.followUp({ content: `**${client.characterNameMap[data.character]}** · ${client.seriesNameMap[data.series]} is already on your wish list.` });
    }

    // Add wish count to character
    const characterDocument = await CharacterModel().findOneAndUpdate(
      {
        character: data.character,
        series: data.series,
      }, // Filter
      { $inc: { wishCount: 1 } },
      { new: true } // Options
    );

    // Update message
    if (!characterDocument) {
      embed.setColor(config.embedColor.red);
      this.collector.stop();
      return await interaction.followUp({ content: "There was an issue adding to your wish list. Please try again." });
    }
    embed.setColor(config.embedColor.green);
    this.collector.stop();
    return await interaction.followUp({ content: `Successfully added **${client.characterNameMap[data.character]}** · ${client.seriesNameMap[data.series]} to your wish list!` });
  }
}

module.exports = WishListAddButtonPages;
