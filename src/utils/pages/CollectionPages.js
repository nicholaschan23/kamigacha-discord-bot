const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, AttachmentBuilder } = require("discord.js");
const ButtonPages = require("./ButtonPages");
const { formatCardInfoPage, chunkArray } = require("../gacha/format");
const { parseFilterString, applyFilters } = require("../gacha/filter");
const { getCardBorder } = require("../graphics/getCardBorder");
const { createCardGrid } = require("../graphics/createCardGrid");
const { v4: uuidv4 } = require("uuid");

class CollectionPages extends ButtonPages {
  constructor(interaction, collectionDocument, filterString, filterMenu) {
    super(interaction, [], collectionDocument.isPrivate);
    this.collectionDocument = collectionDocument;
    this.filterString = filterString;
    this.filterMenu = filterMenu;

    this.isEnd = false;
    this.cardList = [...collectionDocument.cardsOwned].reverse();
    this.updatePages(parseFilterString(filterString));

    if (!filterString) {
      this.filterString = "order=date";
    }
  }

  updatePages(filters) {
    let display;
    [this.filteredList, display] = applyFilters([...this.cardList], filters, this.interaction.user.id, this.interaction.guild.id);

    // Split the list of cards into chunks of 10
    this.cardChunks = chunkArray(this.filteredList, 10);

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
    if (cardDataChunks.length == 0) {
      const embed = new EmbedBuilder()
        .setTitle(`Card Collection`)
        .setDescription(`Cards owned by <@${this.collectionDocument.userId}>\n\n` + "No cards found with that filter.")
        .setFooter({ text: `Showing cards 0-0 (${this.cardList.length.toLocaleString()} total)` });
      pages.push(embed);
    }

    for (let i = 0; i < cardDataChunks.length; i++) {
      const embed = new EmbedBuilder()
        .setTitle(`Card Collection`)
        .setDescription(`Cards owned by <@${this.collectionDocument.userId}>\n\n` + formatCardInfoPage(cardDataChunks[i]))
        .setFooter({ text: `Showing cards ${(i * 10 + 1).toLocaleString()}-${(i * 10 + cardDataChunks[i].length).toLocaleString()} (${this.cardList.length.toLocaleString()} total)` });
      pages.push(embed);
    }
    return pages;
  }

  addComponents() {
    // Button row
    const ends = new ButtonBuilder().setCustomId("toggleEnds").setEmoji("↔️").setStyle(ButtonStyle.Secondary);
    const prev = new ButtonBuilder().setCustomId("viewPrev").setEmoji("⬅️").setStyle(ButtonStyle.Primary).setDisabled(true);
    const next = new ButtonBuilder().setCustomId("viewNext").setEmoji("➡️").setStyle(ButtonStyle.Primary);
    const clipboard = new ButtonBuilder().setCustomId("copyCodes").setEmoji("📋").setStyle(ButtonStyle.Secondary);
    const view = new ButtonBuilder().setCustomId("viewImages").setEmoji("🖼️").setStyle(ButtonStyle.Secondary);
    this.components["toggleEnds"] = ends;
    this.components["viewPrev"] = prev;
    this.components["viewNext"] = next;
    this.components["copyCodes"] = clipboard;
    this.components["viewImages"] = view;
    const buttonRow = new ActionRowBuilder().addComponents(ends, prev, next, clipboard, view);
    this.messageComponents.push(buttonRow);

    // Select menu row
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("collectionFilters")
      .setPlaceholder("Select a filter")
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(this.filterMenu.map(({ emoji, label, filter }) => new StringSelectMenuOptionBuilder().setEmoji(emoji).setLabel(label).setValue(filter)));
    const selectRow = new ActionRowBuilder().addComponents(selectMenu);
    this.components["collectionFilters"] = selectMenu;
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
        this.updatePageButtons(i);
        break;
      }
      case "viewPrev": {
        if (this.index > 0) {
          this.index--;
        }
        this.updatePageButtons(i);
        break;
      }
      case "viewNext": {
        if (this.index < this.pages.length - 1) {
          this.index++;
        }
        this.updatePageButtons(i);
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
        await this.interaction.followUp(codes.join(", "));
        break;
      }
      case "viewImages": {
        // Allow pressing once
        const view = this.components["viewImages"];
        view.setDisabled(true);

        const imageUrls = this.cardChunks[this.index].map((card) => card.image);
        const borderPaths = this.cardChunks[this.index].map((card) => getCardBorder(card.rarity));
        const buffer = await createCardGrid(imageUrls, borderPaths);

        // Create a unique attachment name
        const attachmentName = `${uuidv4()}.png`;

        // Create an attachment from the buffer
        const imageFile = new AttachmentBuilder(buffer, { name: attachmentName });

        // Create the attachment URL
        const attachmentUrl = `attachment://${attachmentName}`;

        await this.interaction.followUp({ embeds: [new EmbedBuilder().setImage(attachmentUrl)], files: [imageFile] });
        break;
      }
      case "collectionFilters": {
        const selectedValue = i.values[0];
        this.filterString = selectedValue;
        this.updatePages(parseFilterString(this.filterString));
        this.updatePageButtons(i);
        break;
      }
      default:
        return;
    }

    this.collector.resetTimer();
  }

  updatePageButtons(i) {
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