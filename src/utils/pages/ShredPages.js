const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js");
const CardModel = require("@database/mongodb/models/card/card");
const CollectionModel = require("@database/mongodb/models/card/collection");
const InventoryModel = require("@database/mongodb/models/user/inventory");
const { parseFilterString, applyFilters } = require("@utils/gacha/filter");
const { chunkArray, formatCardInfoPage, formatInventoryPage } = require("@utils/string/formatPage");
const { calculateRipValues } = require("@utils/gacha/calculateRipValue");
const config = require("@config");
const CollectionPages = require("./CollectionPages");

class ShredPages extends CollectionPages {
  constructor(interaction, collectionDocument, filterString, filterMenu) {
    super(interaction, collectionDocument, filterString, filterMenu);
  }

  /**
   * Helper function to create embeds for each page.
   *
   * @param {Array<Array>} cardDataChunks - An array of arrays, where each inner array contains card data.
   * @returns {Array<EmbedBuilder>} An array of embed pages.
   */
  async createPages(cardDataChunks) {
    // Embed to show value of ripping cards
    this.items = await calculateRipValues(this.filteredList);
    const formattedItems = formatInventoryPage(this.items, { itemCode: false });

    const embed = new EmbedBuilder().setTitle("Shred Cards").setDescription(`${this.interaction.user}, you will receive:\n\n` + formattedItems);
    embed.setColor(config.embedColor.yellow);
    this.valuePage = embed;

    // Collection pages
    const pages = [];
    if (cardDataChunks.length == 0) {
      const embed = new EmbedBuilder()
        .setDescription(`You are ripping these **0** cards:`)
        .setFooter({ text: `Showing cards 0-0 (0 total)` })
        .setColor(config.embedColor.yellow);
      pages.push(embed);
    } else {
      const numCards = this.filteredList.length.toLocaleString();

      for (let i = 0; i < cardDataChunks.length; i++) {
        const formattedPages = await formatCardInfoPage(cardDataChunks[i], this.displayFeatures);
        const embed = new EmbedBuilder()
          .setDescription(`You are ripping these **${numCards}** cards:\n\n` + formattedPages)
          .setFooter({ text: `Showing cards ${(i * 10 + 1).toLocaleString()}-${(i * 10 + cardDataChunks[i].length).toLocaleString()} (${numCards} total)` })
          .setColor(config.embedColor.yellow);
        pages.push(embed);
      }
    }

    return pages;
  }

  addComponents() {
    // Button row
    const ends = new ButtonBuilder().setCustomId("toggleEnds").setEmoji("↔️").setStyle(ButtonStyle.Secondary);
    const prev = new ButtonBuilder().setCustomId("viewPrev").setEmoji("⬅️").setStyle(ButtonStyle.Primary);
    const next = new ButtonBuilder().setCustomId("viewNext").setEmoji("➡️").setStyle(ButtonStyle.Primary);
    const cancel = new ButtonBuilder().setCustomId("cancel").setEmoji("❌").setStyle(ButtonStyle.Secondary);
    const rip = new ButtonBuilder().setCustomId("rip").setEmoji("✂️").setStyle(ButtonStyle.Secondary);
    this.components["toggleEnds"] = ends;
    this.components["viewPrev"] = prev;
    this.components["viewNext"] = next;
    this.components["cancel"] = cancel;
    this.components["rip"] = rip;
    const buttonRow = new ActionRowBuilder().addComponents(ends, prev, next, cancel, rip);
    this.messageComponents.push(buttonRow);
    this.updateComponents();

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

  async publishPages(isDeferred = false) {
    if (!isDeferred) {
      await this.interaction.deferReply({ ephemeral: this.ephemeral });
    }

    await this.addComponents();

    const currentPage = await this.interaction.editReply({
      embeds: [this.valuePage, this.pages[this.index]],
      components: this.messageComponents,
      fetchReply: true,
    });

    // No components to listen to
    if (this.messageComponents.length === 0) return;

    // Initialize collectors
    this.collector = await currentPage.createMessageComponentCollector({
      filter: (i) => i.user.id === this.interaction.user.id,
      time: 60_000,
    });
    this.collector.on("collect", this.handleCollect.bind(this));
    this.collector.on("end", this.handleEnd.bind(this, currentPage));

    return;
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
      case "cancel": {
        this.state = "CANCELLED";
        this.collector.stop();
        break;
      }
      case "rip": {
        if (this.state === "AWAIT_CONFIRM") {
          // Rip the cards
          const session = await CardModel.startSession();
          session.startTransaction();

          try {
            // Remove card from user's collection
            for (const card of this.filteredList) {
              await CollectionModel.updateOne({ userId: i.user.id }, { $pull: { cardsOwned: card._id } }, { session: session });
              await CardModel.deleteOne({ _id: card._id }, { session: session });
            }

            // Add items to user's inventory
            for (const item of this.items) {
              await InventoryModel.updateOne(
                { userId: i.user.id },
                { $inc: { [`inventory.${item.name}`]: item.quantity } },
                { upsert: true, session: session }
              );
            }

            // Commit the transaction
            await session.commitTransaction();
            this.state = "COMPLETE";
          } catch (error) {
            this.state = "ABORTED";
            await session.abortTransaction();
            console.error("Transaction error:", error);
          } finally {
            session.endSession();
            this.collector.stop();
            return;
          }
        }

        this.state = "AWAIT_CONFIRM";
        const rip = this.components["rip"];
        rip.setStyle(ButtonStyle.Success);
        this.updatePage(i);
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

  /**
   * Handles the end of the trade session.
   * Updates message content, embed color, and removes action row.
   * @param {Message} message - The Discord message object to be updated.
   * @param {String} reason - The reason for ending the trade from the collector.
   */
  async handleEnd(message, reason) {
    const msg = await message.fetch();

    if (reason === "time") {
      this.state = "EXPIRED";
    }

    switch (this.state) {
      case "ABORTED":
      case "CANCELLED":
      case "EXPIRED":
        const footerText = {
          ABORTED: "Aborted ripping cards.",
          EXPIRED: "Timed out.",
          CANCELLED: "Cancelled ripping cards.",
        }[this.state];
        msg.edit({
          content: footerText,
          embeds: this.setColorToEmbeds(msg.embeds, config.embedColor.red),
          components: [],
        });
        break;
      case "COMPLETE":
        msg.edit({
          content: `Successfully ripped cards.`,
          embeds: this.setColorToEmbeds(msg.embeds, config.embedColor.green),
          components: [],
        });
        break;
      default:
        msg.edit({
          embeds: this.setColorToEmbeds(msg.embeds, config.embedColor.red),
          components: [],
        });
    }
  }

  updateComponents() {
    // Update disabled states of page buttons
    const ends = this.components["toggleEnds"];
    const prev = this.components["viewPrev"];
    const next = this.components["viewNext"];
    if (this.index === 0 && this.index === this.pages.length - 1) {
      ends.setDisabled(true);
    } else {
      ends.setDisabled(false);
    }
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

    const rip = this.components["rip"];
    if (this.filteredList.length === 0) {
      rip.setDisabled(true);
    } else {
      rip.setDisabled(false);
    }
  }

  updatePage(i) {
    // Update message
    i.message.edit({
      embeds: [this.valuePage, this.pages[this.index]],
      components: this.messageComponents,
    });
  }

  /**
   * Changes the color of the embeds.
   * @param {Embed} embeds - Array of Embed.
   * @param {String} color - HEX code for the color.
   * @returns Array of Embed with the updated color.
   */
  setColorToEmbeds(embeds, color) {
    return embeds.map((embed) => {
      const temp = new EmbedBuilder(embed);
      temp.setColor(color);
      return temp;
    });
  }
}

module.exports = ShredPages;
