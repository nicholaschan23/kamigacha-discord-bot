const { EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require("discord.js");
const LookupButtonPages = require("./LookupButtonPages");
const { formatWishlistPage } = require("../gacha/format");
const WishlistModel = require("../../database/mongodb/models/user/wishlist");
const CharacterModel = require("../../database/mongodb/models/global/character");
const config = require("../../config");
const client = require("../../../bot");

class WishlistRemoveButtonPages extends LookupButtonPages {
  constructor(interaction, wishlistDocument) {
    super(interaction, wishlistDocument.wishlist);
    this.user = interaction.user;
    this.wishlistLimit = wishlistDocument.wishlistLimit;
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
        .setTitle(`Wishlist`)
        .setDescription(`Showing wishlist of ${this.user}\n` + `Available slots: **${this.pageData.length}**/${this.wishlistLimit}\n\n` + `${formatWishlistPage(pageDataChunks[i])}`)
        .setFooter({ text: `Showing cards ${(i * 10 + 1).toLocaleString()}-${(i * 10 + pageDataChunks[i].length).toLocaleString()} (${this.pageData.length.toLocaleString()} total)` });
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
      .addOptions(this.pageDataChunks[this.index].map(({ character, series }) => new StringSelectMenuOptionBuilder().setLabel(client.characterNameMap[character]).setValue(`${JSON.stringify({ character: character, series: series })}`)));
    this.components["characterSelect"] = selectMenu;
    const selectRow = new ActionRowBuilder().addComponents(selectMenu);
    this.messageComponents.push(selectRow);
  }

  async handleSelect(interaction, value) {
    const embed = this.pages[this.index];
    const data = JSON.parse(value);

    // Save document
    const characterToAdd = { character: data.character, series: data.series };
    const wishlistDocument = await WishlistModel().findOneAndUpdate(
      {
        userId: interaction.user.id,
        wishlist: { $elemMatch: characterToAdd },
      }, // Filter
      {
        $pull: {
          wishlist: characterToAdd,
        },
      }, // Update
      { new: true }
    );

    // Somehow wishlist entry was not found to remove
    if (!wishlistDocument) {
      embed.setColor(config.embedColor.red);
      this.collector.stop();
      return await interaction.followUp({ content: `**${client.characterNameMap[data.character]}** from ${client.seriesNameMap[data.series]} is not on your wishlist.` });
    }

    // Remove wishlist amount from character
    const characterDocument = await CharacterModel().findOneAndUpdate(
      {
        character: data.character,
        series: data.series,
      }, // Filter
      { $inc: { wishlist: -1 } },
      { new: true } // Options
    );

    // Update message
    if (!characterDocument) {
      embed.setColor(config.embedColor.red);
      this.collector.stop();
      return await interaction.followUp({ content: "There was an issue removing from your wishlist. Please try again." });
    }
    embed.setColor(config.embedColor.green);
    this.collector.stop();
    return await interaction.followUp({ content: `Successfully removed **${client.characterNameMap[data.character]}** from ${client.seriesNameMap[data.series]} to your wishlist!` });
  }
}

module.exports = WishlistRemoveButtonPages;
