const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js");
const ButtonPages = require("./ButtonPages");
const { capitalizeFirstLetter } = require("../stringUtils");
const { formatInventoryPage, chunkArray } = require("../gacha/format");
const config = require("../../config");

class InventoryPages extends ButtonPages {
  constructor(interaction, inventoryDocument) {
    super(interaction, [], inventoryDocument.isPrivate);
    this.inventoryDocument = inventoryDocument;
    this.inventory = inventoryDocument.inventory;
    this.init();
    this.pages = this.createPages();
  }

  init() {
    // Initialize an empty set to store parsed item types
    const parsedTypes = new Set();

    // Only 1 item, add to set
    if (this.inventory.size === 1) {
      const [key, item] = this.inventory.entries().next().value;
      parsedTypes.add(item.type);
    }

    this.sortedInventory = [...this.inventory.entries()].sort((a, b) => {
      // Key is item name
      const [keyA, itemA] = a;
      const [keyB, itemB] = b;

      // Update item type set
      parsedTypes.add(itemA.type);

      // Compare by the index of type in the predefined order
      const typeComparison = Object.keys(config.itemTypes).indexOf(itemA.type) - Object.keys(config.itemTypes).indexOf(itemB.type);
      if (typeComparison !== 0) {
        return typeComparison;
      }

      // Break ties by quantity (descending order)
      const quantityComparison = itemB.quantity - itemA.quantity; // Higher quantity first
      if (quantityComparison !== 0) {
        return quantityComparison;
      }

      // Break ties by name (ascending order)
      return keyA.localeCompare(keyB);
    });

    // Filter item types to only those present in the inventory
    this.itemTypes = Object.keys(config.itemTypes).filter((type) => parsedTypes.has(type));
  }

  createPages(itemType = []) {
    // Start on first page
    this.index = 0;

    // Filter sorted inventory
    let filteredInventory = [...this.sortedInventory];
    if (itemType.length > 0) {
      filteredInventory = filteredInventory.filter(([key, item]) => {
        return itemType.includes(item.type);
      });
    }

    // Chunk data to make content for pages
    const dataChunks = chunkArray(filteredInventory, 10);

    // Create embed
    const pages = [];
    for (let i = 0; i < dataChunks.length; i++) {
      const embed = new EmbedBuilder()
        .setTitle(`Inventory`)
        .setDescription(`Items carried by <@${this.inventoryDocument.userId}>\n\n` + formatInventoryPage(dataChunks[i]))
        .setFooter({ text: `Showing items ${(i * 10 + 1).toLocaleString()}-${(i * 10 + dataChunks[i].length).toLocaleString()} (${filteredInventory.length.toLocaleString()} total)` });
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
    this.updateComponents();

    // Select menu row
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("inventoryFilters")
      .setPlaceholder("Select a filter")
      .setMinValues(1)
      // .setMaxValues(1)
      .addOptions(
        this.itemTypes.map((type) => {
          const emoji = config.itemTypes[type].icon;
          const label = capitalizeFirstLetter(type);
          const value = type;
          return new StringSelectMenuOptionBuilder().setEmoji(emoji).setLabel(label).setValue(value);
        })
      );
    const selectRow = new ActionRowBuilder().addComponents(selectMenu);
    this.components["inventoryFilters"] = selectMenu;
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
        break;
      }
      case "viewPrev": {
        if (this.index > 0) {
          this.index--;
        }
        break;
      }
      case "viewNext": {
        if (this.index < this.pages.length - 1) {
          this.index++;
        }
        break;
      }
      case "inventoryFilters": {
        const selectedValues = i.values;
        this.pages = this.createPages(selectedValues);
        break;
      }
      default:
        return;
    }

    this.updateComponents();

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
  }
}

module.exports = InventoryPages;
