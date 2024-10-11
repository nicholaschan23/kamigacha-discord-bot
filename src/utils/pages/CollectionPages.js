const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js");
const ButtonPages = require("./ButtonPages");
const WishCountCache = require("@database/redis/cache/characterWishCount");
const { parseFilterString, applyFilters } = require("@utils/gacha/filter");
const { generateGridCardAttachment } = require("@utils/graphics/generateCardAttachment");
const { chunkArray, formatCardInfoPage } = require("@utils/string/formatPage");

class CollectionPages extends ButtonPages {
  constructor(interaction, collectionDocument, filterString, filterMenu) {
    super(interaction, [], collectionDocument.isPrivate);
    this.collectionDocument = collectionDocument;
    this.filterString = filterString || "";
    this.filterMenu = filterMenu;

    this.cardList = [...collectionDocument.cardsOwned].reverse();
  }

  async init() {
    // Fetch wish count for each card
    await Promise.all(
      this.cardList.map(async (card) => {
        const wishCount = await WishCountCache.getWishCount(card.character, card.series);
        card.wishCount = wishCount;
      })
    );

    await this.updatePageContent(parseFilterString(this.filterString));
  }

  async updatePageContent(filters) {
    [this.filteredList, this.displayFeatures] = await applyFilters([...this.cardList], filters, this.interaction.user.id, this.interaction.guild.id);

    // Split the list of cards into chunks of 10
    this.cardChunks = chunkArray(this.filteredList, 10);

    // Create page embeds
    this.pages = await this.createPages(this.cardChunks);

    this.index = 0;
  }

  /**
   * Helper function to create embeds for each page.
   *
   * @param {Array<Array>} cardDataChunks - An array of arrays, where each inner array contains card data.
   * @returns {Array<EmbedBuilder>} An array of embed pages.
   */
  async createPages(cardDataChunks) {
    const pages = [];
    if (cardDataChunks.length == 0) {
      const embed = new EmbedBuilder()
        .setTitle(`Card Collection`)
        .setDescription(`Cards owned by <@${this.collectionDocument.userId}>`)
        .setFooter({ text: `Showing cards 0-0 (${this.cardList.length.toLocaleString()} total)` });
      pages.push(embed);
    }

    for (let i = 0; i < cardDataChunks.length; i++) {
      const formattedPages = await formatCardInfoPage(cardDataChunks[i], this.displayFeatures);
      const embed = new EmbedBuilder()
        .setTitle(`Card Collection`)
        .setDescription(`Cards owned by <@${this.collectionDocument.userId}>\n\n` + formattedPages)
        .setFooter({
          text: `Showing cards ${(i * 10 + 1).toLocaleString()}-${(
            i * 10 +
            cardDataChunks[i].length
          ).toLocaleString()} (${this.cardList.length.toLocaleString()} total)`,
        });
      pages.push(embed);
    }
    return pages;
  }

  addComponents() {
    // Button row
    const ends = new ButtonBuilder().setCustomId("toggleEnds").setEmoji("↔️").setStyle(ButtonStyle.Secondary);
    const prev = new ButtonBuilder().setCustomId("viewPrev").setEmoji("⬅️").setStyle(ButtonStyle.Primary);
    const next = new ButtonBuilder().setCustomId("viewNext").setEmoji("➡️").setStyle(ButtonStyle.Primary);
    const clipboard = new ButtonBuilder().setCustomId("copyCodes").setEmoji("📋").setStyle(ButtonStyle.Secondary);
    const view = new ButtonBuilder().setCustomId("viewImages").setEmoji("🖼️").setStyle(ButtonStyle.Secondary);
    this.components["toggleEnds"] = ends;
    this.components["viewPrev"] = prev;
    this.components["viewNext"] = next;
    this.components["copyCodes"] = clipboard;
    this.components["viewImages"] = view;
    this.updateComponents();
    const buttonRow = new ActionRowBuilder().addComponents(ends, prev, next, clipboard, view);
    this.messageComponents.push(buttonRow);

    // Select menu row
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("collectionFilters")
      .setPlaceholder("Select filters")
      .setMinValues(1)
      .setMaxValues(this.filterMenu.length)
      .addOptions(this.filterMenu.map(({ emoji, label, filter }) => new StringSelectMenuOptionBuilder().setEmoji(emoji).setLabel(label).setValue(filter)));
    const selectRow = new ActionRowBuilder().addComponents(selectMenu);
    this.components["collectionFilters"] = selectMenu;
    this.messageComponents.push(selectRow);
  }

  async handleCollect(i) {
    await i.deferUpdate();

    switch (i.customId) {
      case "toggleEnds": {
        const last = this.pages.length - 1;
        if (this.index === 0 || this.index < last / 2) {
          this.index = last;
        } else {
          this.index = 0;
        }
        this.updateComponents();
        this.updatePage(i);
        break;
      }
      case "viewPrev": {
        if (this.index > 0) {
          this.index--;
        }
        this.updateComponents();
        this.updatePage(i);
        break;
      }
      case "viewNext": {
        if (this.index < this.pages.length - 1) {
          this.index++;
        }
        this.updateComponents();
        this.updatePage(i);
        break;
      }
      case "copyCodes": {
        // Allow pressing once
        const copy = this.components["copyCodes"];
        copy.setDisabled(true);

        const codes = [];
        for (const cardData of this.cardChunks[this.index]) {
          codes.push(cardData.code);
        }

        this.updatePage(i);
        await this.interaction.followUp(codes.join(", "));
        break;
      }
      case "viewImages": {
        // Allow pressing once
        const view = this.components["viewImages"];
        view.setDisabled(true);

        const { file, url } = await generateGridCardAttachment(this.cardChunks[this.index]);

        this.updatePage(i);
        await i.followUp({ embeds: [new EmbedBuilder().setImage(url)], files: [file] });
        break;
      }
      case "collectionFilters": {
        const selectedValue = i.values.join(" ");
        this.filterString = selectedValue;
        await this.updatePageContent(parseFilterString(this.filterString));
        this.updateComponents();
        this.updatePage(i);
        break;
      }
      default:
        return;
    }

    this.collector.resetTimer();
  }

  updateComponents() {
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

    // Disable if there are no codes to copy
    const copy = this.components["copyCodes"];
    if (this.cardChunks.length == 0) {
      copy.setDisabled(true);
    } else {
      copy.setDisabled(false);
    }

    // Disable if there are no card images to view
    const view = this.components["viewImages"];
    if (this.cardChunks.length == 0) {
      view.setDisabled(true);
    } else {
      view.setDisabled(false);
    }
  }

  updatePage(i) {
    // Update message
    if (this.ephemeral) {
      this.interaction.editReply({
        embeds: [this.pages[this.index]],
        components: this.messageComponents,
        fetchReply: true,
      });
    } else {
      i.message.edit({
        embeds: [this.pages[this.index]],
        components: this.messageComponents,
      });
    }
  }
}

module.exports = CollectionPages;
