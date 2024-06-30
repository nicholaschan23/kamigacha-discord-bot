const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const ButtonPages = require("./ButtonPages");
const { formatCardInfoPage, chunkArray } = require("../gacha/format");
const { parseFilterString, applyFilters } = require("../gacha/filter");

class CollectionButtonPages extends ButtonPages {
  constructor(interaction, collectionDocument, filterString) {
    super(interaction, [], collectionDocument.isPrivate);
    this.interaction = interaction;
    this.collectionDocument = collectionDocument;
    this.filterString = filterString;

    this.isEnd = false;
    this.cardList = [...collectionDocument.cardsOwned].reverse();
    this.updatePages(parseFilterString(filterString));
  }

  updatePages(filters) {
    this.filteredList = applyFilters([...this.cardList], filters, this.interaction.user.id, this.interaction.guild.id);
    this.filteredListReversed = null;

    // if (sortBy === "date") {
    //   this.filteredList = [...this.cardList];
    //   this.filteredListReversed = [...this.collectionDocument.cardsOwned];
    // }

    // Split the list of cards into chunks of 10
    this.cardChunksOriginal = chunkArray(this.filteredList, 10);
    this.cardChunksReversed = null;
    this.cardChunks = this.cardChunksOriginal;

    // Create page embeds
    this.pagesOriginal = this.createPages(this.cardChunks);
    this.pagesReversed = null;
    this.pages = this.pagesOriginal;
  }

  /**
   * Helper function to create embeds for each page.
   *
   * @param {Array<Array>} cardDataChunks - An array of arrays, where each inner array contains card data.
   * @returns {Array<EmbedBuilder>} An array of embed pages.
   */
  createPages(cardDataChunks) {
    const pages = [];
    if (cardDataChunks.length == 0) {
      const embed = new EmbedBuilder()
        .setTitle(`Card Collection`)
        .setDescription(`Cards owned by ${this.interaction.user}\n\n` + "No cards found with that filter.")
        .setFooter({ text: `Showing cards 0-0 (${this.cardList.length.toLocaleString()} total)` });
      pages.push(embed);
    }

    for (let i = 0; i < cardDataChunks.length; i++) {
      const embed = new EmbedBuilder()
        .setTitle(`Card Collection`)
        .setDescription(`Cards owned by ${this.interaction.user}\n\n` + formatCardInfoPage(cardDataChunks[i]))
        .setFooter({ text: `Showing cards ${(i * 10 + 1).toLocaleString()}-${(i * 10 + this.cardChunks[i].length).toLocaleString()} (${this.cardList.length.toLocaleString()} total)` });
      pages.push(embed);
    }
    return pages;
  }

  addComponents() {
    // Button row
    const ends = new ButtonBuilder().setCustomId("toggleEnds").setEmoji("↔️").setStyle(ButtonStyle.Secondary);
    const prev = new ButtonBuilder().setCustomId("viewPrev").setEmoji("⬅️").setStyle(ButtonStyle.Primary).setDisabled(true);
    const next = new ButtonBuilder().setCustomId("viewNext").setEmoji("➡️").setStyle(ButtonStyle.Primary);
    const clipboard = new ButtonBuilder().setCustomId("copyClipboard").setEmoji("📋").setStyle(ButtonStyle.Secondary);
    const save = new ButtonBuilder().setCustomId("saveFilter").setEmoji("💾").setStyle(ButtonStyle.Secondary);
    this.components["toggleEnds"] = ends;
    this.components["viewPrev"] = prev;
    this.components["viewNext"] = next;
    this.components["copyClipboard"] = clipboard;
    this.components["saveFilter"] = save;
    const buttonRow = new ActionRowBuilder().addComponents(ends, prev, next, clipboard, save);
    this.messageComponents.push(buttonRow);

    // Select menu row
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("collectionFilters")
      .setPlaceholder("Choose an option")
      .addOptions([
        { label: "Option 1", value: "option1" },
        { label: "Option 2", value: "option2" },
      ]);
    const selectRow = new ActionRowBuilder().addComponents(selectMenu);
    this.messageComponents.push(selectRow);
  }

  async handleCollect(i) {
    await i.deferUpdate();

    // Handle page buttons page buttons
    if (i.customId === "viewPrev" || i.customId === "viewNext" || i.customId === "toggleEnds") {
      if (i.customId === "viewPrev" && this.index > 0) {
        this.index--;
      } else if (i.customId === "viewNext" && this.index < this.pages.length - 1) {
        this.index++;
      } else if (i.customId === "toggleEnds") {
        if (!this.isEnd) {
          this.index = this.pages.length - 1;
        } else {
          this.index = 0;
        }
        this.isEnd = !this.isEnd;
      }

      // Update disabled states of previous and next buttons
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
    } else if (i.customId === "copyClipboard") {
      let codes = [];
      for (const cardData of this.cardChunks[this.index]) {
        codes.push(cardData.code);
      }
      await this.interaction.followUp(codes.join(", "));
    } else if (i.customId === "collectionFilters") {
      const selectedValue = i.values;
      await this.interaction.followUp(`You selected: ${selectedValue}`);
    }

    this.collector.resetTimer();
  }
}

module.exports = CollectionButtonPages;
