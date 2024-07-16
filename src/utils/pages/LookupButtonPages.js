const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, AttachmentBuilder } = require("discord.js");
const ButtonPages = require("./ButtonPages");
const { formatLookupPage, getWishlistEmoji, chunkArray } = require("../gacha/format");

class CollectionButtonPages extends ButtonPages {
  constructor(interaction, results) {
    super(interaction);
    this.results = results;

    // Split the list of cards into chunks of 10
    this.cardChunks = chunkArray(this.results, 10);

    // Create page embeds
    this.pages = this.createPages(this.cardChunks);
    this.index = 0;
  }

  /**
   * Helper function to create embeds for each page.
   *
   * @param {Array<Array>} cardDataChunks - An array of arrays, where each inner array contains card data.
   * @returns {Array<EmbedBuilder>} An array of embed pages.
   */
  createPages(cardDataChunks) {
    const pages = [];

    for (let i = 0; i < cardDataChunks.length; i++) {
      const embed = new EmbedBuilder()
        .setTitle(`Character Results`)
        .setDescription(formatLookupPage(cardDataChunks[i], i * 10 + 1))
        .setFooter({ text: `Showing cards ${(i * 10 + 1).toLocaleString()}-${(i * 10 + cardDataChunks[i].length).toLocaleString()} (${this.results.length.toLocaleString()} total)` });
      pages.push(embed);
    }

    return pages;
  }

  addComponents() {
    // Button row
    const ends = new ButtonBuilder().setCustomId("toggleEnds").setEmoji("↔️").setStyle(ButtonStyle.Secondary);
    const prev = new ButtonBuilder().setCustomId("viewPrev").setEmoji("⬅️").setStyle(ButtonStyle.Primary).setDisabled(true);
    const next = new ButtonBuilder().setCustomId("viewNext").setEmoji("➡️").setStyle(ButtonStyle.Primary);
    this.components["toggleEnds"] = ends;
    this.components["viewPrev"] = prev;
    this.components["viewNext"] = next;
    const buttonRow = new ActionRowBuilder().addComponents(ends, prev, next);
    this.messageComponents.push(buttonRow);

    // Select menu row
    this.updateSelectMenu();
  }

  updateSelectMenu() {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("characterSelect")
      .setPlaceholder("Select a character")
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(this.cardChunks[this.index].map(({ character, series, wishlist }) => new StringSelectMenuOptionBuilder().setEmoji(getWishlistEmoji(wishlist)).setLabel(character).setValue(`${character} ${series}}`)));
    this.components["characterSelect"] = selectMenu;
    const selectRow = new ActionRowBuilder().addComponents(selectMenu);
    this.messageComponents.push(selectRow);
  }

  async handleCollect(i) {
    await i.deferUpdate();

    switch (i.customId) {
      case "toggleEnds": {
        if (!this.isEnd) {
          this.index = this.pages.length - 1;
        } else {
          this.index = 0;
        }
        this.isEnd = !this.isEnd;
        await this.updatePageButtons(i);
        break;
      }
      case "viewPrev": {
        if (this.index > 0) {
          this.index--;
        }
        await this.updatePageButtons(i);
        break;
      }
      case "viewNext": {
        if (this.index < this.pages.length - 1) {
          this.index++;
        }
        await this.updatePageButtons(i);
        break;
      }
      case "characterSelect": {
        const selectedValue = i.values[0];
        await this.handleSelect(i, selectedValue);
        break;
      }
      default:
        return;
    }

    this.collector.resetTimer();
  }

  async updatePageButtons(i) {
    // Update disabled states of page buttons
    const ends = this.components["toggleEnds"];
    const prev = this.components["viewPrev"];
    const next = this.components["viewNext"];
    if (this.index === 0) {
      prev.setDisabled(true);
    } else {
      prev.setDisabled(false);
    }
    if (this.index === this.pages.length - 1) {
      next.setDisabled(true);
    } else {
      next.setDisabled(false);
    }
    if (this.index === 0 && this.index === this.pages.length - 1) {
      ends.setDisabled(true);
    } else {
      ends.setDisabled(false);
    }

    this.messageComponents.pop();
    this.updateSelectMenu();

    // Update message
    if (this.ephemeral) {
      await this.interaction.editReply({
        embeds: [this.pages[this.index]],
        components: this.messageComponents,
        fetchReply: true,
      });
    } else {
      await i.message.edit({
        embeds: [this.pages[this.index]],
        components: this.messageComponents,
      });
    }
  }

  async handleSelect(interaction, value) {
    return;
  }
}

module.exports = CollectionButtonPages;
