const { EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require("discord.js");
const { formatWishListPage } = require("../string/formatPage");
const LookupPages = require("./LookupPages");
const WishModel = require("../../database/mongodb/models/user/wish");
const CharacterModel = require("../../database/mongodb/models/global/character");
const config = require("../../config");
const client = require("../../../bot");

class WishListRemoveButtonPages extends LookupPages {
  constructor(interaction, wishDocument) {
    super(interaction, wishDocument.wishList);
    this.user = interaction.user;
    this.wishListLimit = wishDocument.wishListLimit;
  }

  /**
   * Helper function to create embeds for each page.
   *
   * @param {Array<Array>} pageDataChunks - An array of arrays, where each inner array contains string data to format.
   */
  createPages(pageDataChunks = this.pageDataChunks) {
    const pages = [];

    for (let i = 0; i < pageDataChunks.length; i++) {
      const embed = new EmbedBuilder()
        .setTitle(`Wish List`)
        .setDescription(`Owned by ${this.user}\n` + `Available slots: **${this.wishListLimit - this.pageData.length}**/${this.wishListLimit}\n\n` + `${formatWishListPage(pageDataChunks[i])}`)
        .setFooter({ text: `Showing characters ${(i * 10 + 1).toLocaleString()}-${(i * 10 + pageDataChunks[i].length).toLocaleString()} (${this.pageData.length.toLocaleString()} total)` });
      pages.push(embed);
    }

    this.pages = pages;
    this.index = 0;
  }

  updateSelectMenu() {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("characterSelect")
      .setPlaceholder("Select a character")
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(this.pageDataChunks[this.index].map(({ character, series }) => new StringSelectMenuOptionBuilder().setLabel(client.characterNameMap.get(character)).setValue(`${JSON.stringify({ character: character, series: series })}`)));
    this.components["characterSelect"] = selectMenu;
    const selectRow = new ActionRowBuilder().addComponents(selectMenu);
    this.messageComponents.push(selectRow);
  }

  async handleSelect(interaction, value) {
    const embed = this.pages[this.index];
    const data = JSON.parse(value);

    // Save document
    const characterToAdd = { character: data.character, series: data.series };
    const wishDocument = await WishModel().findOneAndUpdate(
      {
        userId: interaction.user.id,
        wishList: { $elemMatch: characterToAdd },
      }, // Filter
      {
        $pull: {
          wishList: characterToAdd,
        },
      }, // Update
      { new: true }
    );

    // Somehow wish list entry was not found to remove
    if (!wishDocument) {
      embed.setColor(config.embedColor.red);
      this.collector.stop();
      return await interaction.followUp({ content: `**${client.characterNameMap.get(data.character)}** · ${client.seriesNameMap.get(data.series)} is not on your wish list.` });
    }

    // Remove wish count from character
    const characterDocument = await CharacterModel().findOneAndUpdate(
      {
        character: data.character,
        series: data.series,
      }, // Filter
      { $inc: { wishCount: -1 } },
      { new: true } // Options
    );

    // Update message
    if (!characterDocument) {
      embed.setColor(config.embedColor.red);
      this.collector.stop();
      return await interaction.followUp({ content: "There was an issue removing from your wish list. Please try again." });
    }
    embed.setColor(config.embedColor.green);
    this.collector.stop();
    return await interaction.followUp({ content: `Successfully removed **${client.characterNameMap.get(data.character)}** · ${client.seriesNameMap.get(data.series)} from your wish list!` });
  }
}

module.exports = WishListRemoveButtonPages;
